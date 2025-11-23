import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Lấy chi tiết lớp học
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

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        enrollments: {
          where: { isActive: true },
          include: { student: { select: { id: true, name: true, email: true } } },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { submissions: true } } },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error("Get classroom error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// PATCH - Cập nhật lớp học
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const classroom = await prisma.classroom.findUnique({ where: { id } });

    if (!classroom) {
      return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });
    }

    // Chỉ giáo viên sở hữu hoặc admin mới được sửa
    if (classroom.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        subject: body.subject,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ classroom: updated });
  } catch (error) {
    console.error("Update classroom error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa lớp học
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({ where: { id } });

    if (!classroom) {
      return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });
    }

    if (classroom.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    await prisma.classroom.delete({ where: { id } });

    return NextResponse.json({ message: "Đã xóa lớp" });
  } catch (error) {
    console.error("Delete classroom error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
