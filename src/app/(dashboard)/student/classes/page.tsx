"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  teacher: {
    id: string;
    name: string;
  };
  _count: {
    assignments: number;
  };
}

export default function StudentClassesPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassrooms();
  }, []);

  async function fetchClassrooms() {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      if (res.ok) {
        setClassrooms(data.classrooms);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lớp học của tôi</h1>
          <p className="text-gray-600">Danh sách các lớp bạn đang tham gia</p>
        </div>
        <Link href="/student/classes/join">
          <Button>+ Tham gia lớp</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {classrooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Bạn chưa tham gia lớp học nào</p>
            <Link href="/student/classes/join">
              <Button>Tham gia lớp bằng mã</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <Link key={classroom.id} href={`/student/classes/${classroom.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{classroom.name}</CardTitle>
                  {classroom.subject && (
                    <p className="text-sm text-gray-500">{classroom.subject}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {classroom.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {classroom.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Giáo viên: {classroom.teacher.name}</span>
                    </div>
                    <div className="pt-2 border-t text-sm text-gray-500">
                      <span>{classroom._count.assignments} bài tập</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
