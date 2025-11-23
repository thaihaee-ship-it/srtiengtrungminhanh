import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

const answerSchema = z.object({
  questionId: z.string(),
  selectedOptionIds: z.array(z.string()).optional(),
  textContent: z.string().optional(),
  audioUrl: z.string().optional(),
  documentLabels: z.record(z.string(), z.boolean()).optional(),
});

const submitSchema = z.object({
  answers: z.array(answerSchema),
  isDraft: z.boolean().optional(),
});

interface QuestionOption {
  id: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  options: QuestionOption[];
  correctText?: string | null;
}

// POST - Nop bai / Luu nhap
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Chi hoc sinh moi duoc nop bai" }, { status: 403 });
    }

    const { id: assignmentId } = await params;
    const body = await request.json();
    const result = submitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { answers, isDraft } = result.data;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        questions: {
          include: { options: true },
        },
        classroom: {
          include: {
            enrollments: {
              where: { studentId: session.user.id, isActive: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Khong tim thay bai tap" }, { status: 404 });
    }

    if (assignment.status !== "OPEN") {
      return NextResponse.json({ error: "Bai tap da dong" }, { status: 400 });
    }

    if (assignment.classroom.enrollments.length === 0) {
      return NextResponse.json({ error: "Ban khong phai thanh vien lop nay" }, { status: 403 });
    }

    if (assignment.deadline && new Date() > assignment.deadline && !isDraft) {
      return NextResponse.json({ error: "Da qua han nop bai" }, { status: 400 });
    }

    let submission = await prisma.submission.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: session.user.id,
          assignmentId,
        },
      },
    });

    if (submission && submission.status === "SUBMITTED") {
      return NextResponse.json({ error: "Ban da nop bai roi" }, { status: 400 });
    }

    let score = 0;
    let maxScore = 0;
    const questions = assignment.questions as Question[];

    // Auto-grading cho MCQ
    if (assignment.type === "MCQ") {
      for (const question of questions) {
        maxScore += 1;
        const answer = answers.find((a) => a.questionId === question.id);
        if (answer?.selectedOptionIds) {
          const correctOptionIds = question.options
            .filter((o: QuestionOption) => o.isCorrect)
            .map((o: QuestionOption) => o.id);
          const isCorrect =
            answer.selectedOptionIds.length === correctOptionIds.length &&
            answer.selectedOptionIds.every((id) => correctOptionIds.includes(id));
          if (isCorrect) score += 1;
        }
      }
    }

    // Auto-grading cho TF_ON_DOCUMENT
    if (assignment.type === "TF_ON_DOCUMENT") {
      for (const question of questions) {
        maxScore += 1;
        const answer = answers.find((a) => a.questionId === question.id);
        if (answer?.textContent && question.correctText) {
          const isCorrect = answer.textContent.toUpperCase() === question.correctText.toUpperCase();
          if (isCorrect) score += 1;
        }
      }
    }

    const isAutoGraded = assignment.type === "MCQ" || assignment.type === "TF_ON_DOCUMENT";
    const finalScoreValue = isAutoGraded && !isDraft && maxScore > 0 ? (score / maxScore) * 10 : null;

    const finalSubmission = await prisma.$transaction(async (tx: TransactionClient) => {
      if (!submission) {
        submission = await tx.submission.create({
          data: {
            studentId: session.user.id,
            assignmentId,
            status: isDraft ? "IN_PROGRESS" : "SUBMITTED",
            submittedAt: isDraft ? null : new Date(),
            score: finalScoreValue,
            maxScore: isAutoGraded ? 10 : null,
          },
        });
      } else {
        submission = await tx.submission.update({
          where: { id: submission.id },
          data: {
            status: isDraft ? "IN_PROGRESS" : "SUBMITTED",
            submittedAt: isDraft ? null : new Date(),
            score: finalScoreValue,
            maxScore: isAutoGraded ? 10 : null,
          },
        });
      }

      await tx.answer.deleteMany({
        where: { submissionId: submission.id },
      });

      for (const ans of answers) {
        const question = questions.find((q: Question) => q.id === ans.questionId);
        if (!question) continue;

        let answerScore: number | null = null;
        let answerMaxScore: number | null = null;

        if (assignment.type === "MCQ" && !isDraft) {
          answerMaxScore = 1;
          const correctOptionIds = question.options
            .filter((o: QuestionOption) => o.isCorrect)
            .map((o: QuestionOption) => o.id);
          const isCorrect =
            ans.selectedOptionIds?.length === correctOptionIds.length &&
            ans.selectedOptionIds?.every((id) => correctOptionIds.includes(id));
          answerScore = isCorrect ? 1 : 0;
        }

        if (assignment.type === "TF_ON_DOCUMENT" && !isDraft) {
          answerMaxScore = 1;
          if (ans.textContent && question.correctText) {
            const isCorrect = ans.textContent.toUpperCase() === question.correctText.toUpperCase();
            answerScore = isCorrect ? 1 : 0;
          } else {
            answerScore = 0;
          }
        }

        await tx.answer.create({
          data: {
            questionId: ans.questionId,
            submissionId: submission.id,
            selectedOptionIds: JSON.stringify(ans.selectedOptionIds || []),
            textContent: ans.textContent,
            audioUrl: ans.audioUrl,
            documentLabels: ans.documentLabels ? JSON.stringify(ans.documentLabels) : null,
            score: answerScore,
            maxScore: answerMaxScore,
          },
        });
      }

      return submission;
    });

    const finalScore = isAutoGraded && !isDraft && maxScore > 0 ? Math.round((score / maxScore) * 10 * 100) / 100 : undefined;

    return NextResponse.json({
      success: true,
      message: isDraft ? "Da luu nhap" : "Nop bai thanh cong",
      submission: finalSubmission,
      score: finalScore,
      details: isAutoGraded && !isDraft ? {
        correctAnswers: score,
        totalQuestions: maxScore,
        scoreOutOf10: finalScore,
      } : undefined,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}
