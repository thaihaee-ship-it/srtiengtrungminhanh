import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const addStudentSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

// POST - Thêm học sinh vào lớp bằng email
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
    const body = await request.json();
    const result = addStudentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Kiểm tra lớp học
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });
    }

    // Chỉ giáo viên của lớp hoặc admin mới được thêm
    if (classroom.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    // Tìm học sinh theo email
    const student = await prisma.user.findUnique({
      where: { email },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Không tìm thấy học sinh với email này" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Người dùng này không phải học sinh" },
        { status: 400 }
      );
    }

    // Kiểm tra xem học sinh đã trong lớp chưa
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classroomId: {
          studentId: student.id,
          classroomId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        return NextResponse.json(
          { error: "Học sinh đã trong lớp này" },
          { status: 400 }
        );
      }
      // Kích hoạt lại enrollment cũ
      const updated = await prisma.classEnrollment.update({
        where: { id: existingEnrollment.id },
        data: { isActive: true },
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
      });
      return NextResponse.json({
        message: "Đã thêm học sinh vào lớp",
        enrollment: updated,
      });
    }

    // Tạo enrollment mới
    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classroomId,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      message: "Đã thêm học sinh vào lớp",
      enrollment,
    });
  } catch (error) {
    console.error("Add student error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// DELETE - Xóa học sinh khỏi lớp
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id: classroomId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Thiếu studentId" },
        { status: 400 }
      );
    }

    // Kiểm tra lớp học
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });
    }

    // Chỉ giáo viên của lớp hoặc admin mới được xóa
    if (classroom.teacherId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    // Tìm enrollment
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classroomId: {
          studentId,
          classroomId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Học sinh không trong lớp này" },
        { status: 404 }
      );
    }

    // Soft delete - đánh dấu isActive = false
    await prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Đã xóa học sinh khỏi lớp" });
  } catch (error) {
    console.error("Remove student error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
