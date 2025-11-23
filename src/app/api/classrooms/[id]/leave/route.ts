import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Học sinh rời lớp
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id: classroomId } = await params;

    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classroomId: {
          studentId: session.user.id,
          classroomId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Bạn không phải thành viên lớp này" },
        { status: 404 }
      );
    }

    await prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Đã rời lớp thành công" });
  } catch (error) {
    console.error("Leave classroom error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
