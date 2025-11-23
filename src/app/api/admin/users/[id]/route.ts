import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(2, "Ten toi thieu 2 ky tu").optional(),
  email: z.string().email("Email khong hop le").optional(),
  password: z.string().min(6, "Mat khau toi thieu 6 ky tu").optional(),
  isActive: z.boolean().optional(),
});

// GET - Lay thong tin user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Khong co quyen" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Khong tim thay user" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}

// PATCH - Cap nhat thong tin user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Khong co quyen" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "Khong tim thay user" }, { status: 404 });
    }

    // Khong cho phep sua ADMIN
    if (user.role === "ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Khong co quyen sua Admin" }, { status: 403 });
    }

    const { name, email, password, isActive } = result.data;

    // Kiem tra email trung
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "Email da duoc su dung" }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 12);
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({ message: "Cap nhat thanh cong", user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}

// DELETE - Xoa user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chua dang nhap" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Khong co quyen" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: "Khong tim thay user" }, { status: 404 });
    }

    // Khong cho phep xoa ADMIN
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Khong the xoa tai khoan Admin" }, { status: 403 });
    }

    // Khong cho tu xoa chinh minh
    if (user.id === session.user.id) {
      return NextResponse.json({ error: "Khong the tu xoa chinh minh" }, { status: 400 });
    }

    // Soft delete - dat isActive = false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Da xoa tai khoan" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Loi server" }, { status: 500 });
  }
}
