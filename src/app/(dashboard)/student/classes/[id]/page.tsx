"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  deadline: string | null;
  createdAt: string;
}

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  teacher: {
    id: string;
    name: string;
  };
  assignments: Assignment[];
}

export default function StudentClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClassroom();
  }, [id]);

  async function fetchClassroom() {
    try {
      const res = await fetch(`/api/classrooms/${id}`);
      const data = await res.json();
      if (res.ok) {
        setClassroom(data.classroom);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tải thông tin lớp");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    if (!confirm("Bạn có chắc muốn rời lớp học này?")) return;

    try {
      const res = await fetch(`/api/classrooms/${id}/leave`, { method: "POST" });
      if (res.ok) {
        router.push("/student/classes");
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("Không thể rời lớp");
    }
  }

  function getDeadlineStatus(deadline: string | null) {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Đã hết hạn", color: "text-red-600" };
    if (days === 0) return { text: "Hết hạn hôm nay", color: "text-orange-600" };
    if (days === 1) return { text: "Còn 1 ngày", color: "text-orange-600" };
    if (days <= 3) return { text: `Còn ${days} ngày`, color: "text-yellow-600" };
    return { text: `Còn ${days} ngày`, color: "text-gray-500" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Không tìm thấy lớp"}</p>
        <Link href="/student/classes">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  const openAssignments = classroom.assignments.filter(
    (a) => a.status === "OPEN"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/student/classes" className="text-gray-500 hover:text-gray-700">
              Lớp học
            </Link>
            <span className="text-gray-400">/</span>
            <span>{classroom.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          <div className="flex items-center gap-4 mt-1">
            {classroom.subject && (
              <span className="text-gray-600">{classroom.subject}</span>
            )}
            <span className="text-gray-500">
              Giáo viên: {classroom.teacher.name}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={handleLeave}>
          Rời lớp
        </Button>
      </div>

      {classroom.description && (
        <Card>
          <CardContent className="py-4">
            <p className="text-gray-600">{classroom.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Assignments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Bài tập ({openAssignments.length} bài đang mở)
        </h2>

        {classroom.assignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Chưa có bài tập nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {classroom.assignments.map((assignment) => {
              const deadlineStatus = getDeadlineStatus(assignment.deadline);
              const isOpen = assignment.status === "OPEN";

              return (
                <Link
                  key={assignment.id}
                  href={
                    isOpen
                      ? `/student/classes/${id}/assignments/${assignment.id}`
                      : "#"
                  }
                  className={!isOpen ? "pointer-events-none" : ""}
                >
                  <Card
                    className={`transition-shadow ${
                      isOpen ? "hover:shadow-md cursor-pointer" : "opacity-60"
                    }`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          {assignment.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {assignment.description}
                            </p>
                          )}
                          <div className="flex gap-3 text-sm mt-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {assignment.type === "MCQ"
                                ? "Trắc nghiệm"
                                : assignment.type === "ESSAY"
                                ? "Tự luận"
                                : assignment.type === "PRONUNCIATION"
                                ? "Phát âm"
                                : assignment.type === "TRANSLATION_SPEAKING"
                                ? "Dịch & Nói"
                                : "Đúng/Sai"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded ${
                                assignment.status === "OPEN"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {assignment.status === "OPEN"
                                ? "Đang mở"
                                : assignment.status === "CLOSED"
                                ? "Đã đóng"
                                : "Nháp"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {deadlineStatus && (
                            <p className={`text-sm ${deadlineStatus.color}`}>
                              {deadlineStatus.text}
                            </p>
                          )}
                          {assignment.deadline && (
                            <p className="text-xs text-gray-400">
                              {new Date(assignment.deadline).toLocaleDateString("vi-VN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
