import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const gradeSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number().min(0),
  feedback: z.string().optional(),
});

// POST - Chấm điểm bài nộp (Essay)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { id: submissionId } = await params;
    const body = await request.json();
    const result = gradeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { score, maxScore, feedback } = result.data;

    // Tìm submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { classroom: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Không tìm thấy bài nộp" }, { status: 404 });
    }

    // Kiểm tra quyền (chỉ giáo viên của lớp hoặc admin)
    if (
      submission.assignment.classroom.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Không có quyền chấm bài này" }, { status: 403 });
    }

    // Cập nhật submission và tạo/cập nhật feedback
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score,
        maxScore,
        status: "GRADED",
        gradedAt: new Date(),
        feedback: feedback
          ? {
              upsert: {
                create: {
                  comment: feedback,
                  teacherId: session.user.id,
                },
                update: {
                  comment: feedback,
                  teacherId: session.user.id,
                },
              },
            }
          : undefined,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        feedback: true,
      },
    });

    return NextResponse.json({
      message: "Đã chấm điểm thành công",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Grade submission error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
