import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const joinSchema = z.object({
  code: z.string().length(6, "Mã lớp phải có 6 ký tự"),
});

// POST - Học sinh tham gia lớp bằng mã
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Chỉ học sinh mới được tham gia lớp
    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Chỉ học sinh mới có thể tham gia lớp" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = joinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code } = result.data;

    // Tìm lớp học theo mã
    const classroom = await prisma.classroom.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        teacher: { select: { name: true } },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Không tìm thấy lớp với mã này" },
        { status: 404 }
      );
    }

    if (!classroom.isActive) {
      return NextResponse.json(
        { error: "Lớp học này đã bị đóng" },
        { status: 400 }
      );
    }

    // Kiểm tra đã tham gia chưa
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        studentId_classroomId: {
          studentId: session.user.id,
          classroomId: classroom.id,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        return NextResponse.json(
          { error: "Bạn đã tham gia lớp này rồi" },
          { status: 400 }
        );
      } else {
        // Kích hoạt lại enrollment
        await prisma.classEnrollment.update({
          where: { id: existingEnrollment.id },
          data: { isActive: true },
        });
        return NextResponse.json({
          message: "Đã tham gia lại lớp thành công",
          classroom: {
            id: classroom.id,
            name: classroom.name,
            teacher: classroom.teacher.name,
          },
        });
      }
    }

    // Tạo enrollment mới
    await prisma.classEnrollment.create({
      data: {
        studentId: session.user.id,
        classroomId: classroom.id,
      },
    });

    return NextResponse.json(
      {
        message: "Tham gia lớp thành công",
        classroom: {
          id: classroom.id,
          name: classroom.name,
          teacher: classroom.teacher.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Join classroom error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
