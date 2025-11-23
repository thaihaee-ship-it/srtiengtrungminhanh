import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface Question {
  id: string;
  content: string;
  correctText: string | null;
  options: QuestionOption[];
}

// GET - Lay chi tiet bai tap
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    const { id } = await params;
    const { role, id: userId } = session.user;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            options: { orderBy: { orderIndex: "asc" } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Khong tim thay bai tap" }, { status: 404 });
    }

    // Neu la hoc sinh, an dap an dung
    if (role === "STUDENT") {
      const questions = assignment.questions as Question[];
      const questionsWithoutAnswer = questions.map((q: Question) => ({
        ...q,
        options: q.options.map((opt: QuestionOption) => ({
          ...opt,
          isCorrect: undefined,
        })),
        correctText: undefined,
      }));

      const submission = await prisma.submission.findUnique({
        where: {
          studentId_assignmentId: {
            studentId: userId,
            assignmentId: id,
          },
        },
        include: {
          answers: true,
        },
      });

      return NextResponse.json({
        assignment: {
          ...assignment,
          questions: questionsWithoutAnswer,
        },
        submission,
      });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId: id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        answers: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ assignment, submissions });
  } catch (error) {
    console.error("Get assignment error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}

// PATCH - Cap nhat bai tap
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { classroom: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Khong tim thay bai tap" }, { status: 404 });
    }

    if (
      assignment.classroom.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Khong co quyen" }, { status: 403 });
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        deadline: body.deadline ? new Date(body.deadline) : null,
      },
    });

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error("Update assignment error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}

// DELETE - Xoa bai tap
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { classroom: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Khong tim thay bai tap" }, { status: 404 });
    }

    if (
      assignment.classroom.teacherId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Khong co quyen" }, { status: 403 });
    }

    await prisma.assignment.delete({ where: { id } });

    return NextResponse.json({ message: "Da xoa bai tap" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}
