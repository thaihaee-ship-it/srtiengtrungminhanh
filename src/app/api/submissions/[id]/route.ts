import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Lấy chi tiết bài nộp
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: {
          include: {
            classroom: {
              include: {
                teacher: { select: { id: true, name: true } },
              },
            },
            questions: {
              orderBy: { orderIndex: "asc" },
              include: { options: { orderBy: { orderIndex: "asc" } } },
            },
          },
        },
        answers: true,
        feedback: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Không tìm thấy bài nộp" }, { status: 404 });
    }

    // Kiểm tra quyền xem
    const isOwner = submission.studentId === session.user.id;
    const isTeacher = submission.assignment.classroom.teacherId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Không có quyền xem" }, { status: 403 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
