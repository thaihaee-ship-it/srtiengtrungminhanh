import { requireTeacher } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, ClipboardList, Users, Plus } from "lucide-react";

export default async function TeacherDashboard() {
  const user = await requireTeacher();

  const stats = [
    { title: "Lớp học của tôi", value: "0", icon: <BookOpen className="h-8 w-8 text-blue-600" /> },
    { title: "Bài tập đã tạo", value: "0", icon: <ClipboardList className="h-8 w-8 text-green-600" /> },
    { title: "Học sinh", value: "0", icon: <Users className="h-8 w-8 text-purple-600" /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Giáo viên</h1>
          <p className="text-gray-600">Xin chào, {user.name}!</p>
        </div>
        <Link href="/teacher/classes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo lớp mới
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle>Lớp học gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Bạn chưa có lớp học nào</p>
            <Link href="/teacher/classes/new">
              <Button variant="outline" className="mt-4">
                Tạo lớp đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bài tập cần chấm</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Không có bài tập nào cần chấm</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
