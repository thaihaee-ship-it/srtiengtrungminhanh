import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Không có file" }, { status: 400 });
    }

    // Kiểm tra loại file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Loại file không được hỗ trợ" },
        { status: 400 }
      );
    }

    // Kiểm tra kích thước
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File quá lớn (tối đa 10MB)" },
        { status: 400 }
      );
    }

    // Tạo tên file unique
    const ext = path.extname(file.name);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomStr}${ext}`;

    // Tạo thư mục theo ngày
    const dateFolder = new Date().toISOString().split("T")[0];
    const uploadDir = path.join(process.cwd(), "public", "uploads", dateFolder);

    await mkdir(uploadDir, { recursive: true });

    // Lưu file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Trả về URL
    const fileUrl = `/uploads/${dateFolder}/${fileName}`;

    return NextResponse.json({
      message: "Upload thành công",
      url: fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Lỗi upload file" }, { status: 500 });
  }
}
