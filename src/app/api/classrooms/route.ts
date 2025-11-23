import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateClassCode } from "@/lib/utils";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().min(1, "Tên lớp là bắt buộc"),
  description: z.string().optional(),
  subject: z.string().optional(),
});

// GET - Lấy danh sách lớp học
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    let classrooms;

    if (role === "ADMIN") {
      // Admin xem tất cả lớp
      classrooms = await prisma.classroom.findMany({
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true, assignments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "TEACHER") {
      // Giáo viên xem lớp của mình
      classrooms = await prisma.classroom.findMany({
        where: { teacherId: userId },
        include: {
          _count: { select: { enrollments: true, assignments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Học sinh xem lớp đã tham gia
      classrooms = await prisma.classroom.findMany({
        where: {
          enrollments: { some: { studentId: userId, isActive: true } },
        },
        include: {
          teacher: { select: { id: true, name: true } },
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ classrooms });
  } catch (error) {
    console.error("Get classrooms error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo lớp học mới (chỉ Teacher/Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const body = await request.json();
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Tạo mã lớp unique
    let code = generateClassCode();
    let exists = await prisma.classroom.findUnique({ where: { code } });
    while (exists) {
      code = generateClassCode();
      exists = await prisma.classroom.findUnique({ where: { code } });
    }

    const classroom = await prisma.classroom.create({
      data: {
        ...result.data,
        code,
        teacherId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Tạo lớp thành công", classroom },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create classroom error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
