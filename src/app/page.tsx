import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Nếu đã đăng nhập, redirect đến dashboard tương ứng
  if (session?.user) {
    const role = session.user.role;
    const dashboardRoutes: Record<string, string> = {
      ADMIN: "/admin",
      MANAGER: "/manager",
      TEACHER: "/teacher",
      STUDENT: "/student",
    };
    redirect(dashboardRoutes[role] || "/student");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            EduApp
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Hệ thống quản lý học tập trực tuyến - Nơi kết nối giáo viên và học sinh
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">Đăng ký</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Cho Giáo viên</h3>
            <p className="text-gray-600">
              Tạo lớp học, giao bài tập, chấm điểm và theo dõi tiến độ học sinh
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Cho Học sinh</h3>
            <p className="text-gray-600">
              Tham gia lớp học, làm bài tập, xem kết quả và nhận phản hồi từ giáo viên
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">5 Loại Bài tập</h3>
            <p className="text-gray-600">
              Trắc nghiệm, Tự luận, Phát âm, Dịch nói, Đánh dấu T/F trên tài liệu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
