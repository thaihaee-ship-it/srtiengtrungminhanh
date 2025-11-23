import { requireAdmin } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, BookOpen, ClipboardList, GraduationCap } from "lucide-react";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  const stats = [
    { title: "Tổng người dùng", value: "0", icon: <Users className="h-8 w-8 text-blue-600" /> },
    { title: "Lớp học", value: "0", icon: <BookOpen className="h-8 w-8 text-green-600" /> },
    { title: "Bài tập", value: "0", icon: <ClipboardList className="h-8 w-8 text-yellow-600" /> },
    { title: "Học sinh", value: "0", icon: <GraduationCap className="h-8 w-8 text-purple-600" /> },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
      <p className="text-gray-600 mb-6">Xin chào, {user.name}!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Chưa có hoạt động nào</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-gray-500">• Tạo giáo viên mới</p>
            <p className="text-gray-500">• Quản lý người dùng</p>
            <p className="text-gray-500">• Xem báo cáo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
