import { requireStudent } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GraduationCap, ClipboardList, CheckCircle, Clock } from "lucide-react";

export default async function StudentDashboard() {
  const user = await requireStudent();

  const stats = [
    { title: "Lớp đang học", value: "0", icon: <GraduationCap className="h-8 w-8 text-blue-600" /> },
    { title: "Bài tập chưa làm", value: "0", icon: <Clock className="h-8 w-8 text-yellow-600" /> },
    { title: "Bài đã hoàn thành", value: "0", icon: <CheckCircle className="h-8 w-8 text-green-600" /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Học sinh</h1>
          <p className="text-gray-600">Xin chào, {user.name}!</p>
        </div>
        <Link href="/student/classes/join">
          <Button>
            Tham gia lớp học
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
            <CardTitle>Lớp học của tôi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Bạn chưa tham gia lớp nào</p>
            <Link href="/student/classes/join">
              <Button variant="outline" className="mt-4">
                Tham gia lớp học
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bài tập sắp đến hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Không có bài tập nào sắp đến hạn</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
