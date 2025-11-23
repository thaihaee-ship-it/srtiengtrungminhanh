"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Assignment {
  id: string;
  title: string;
  type: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  _count: {
    submissions: number;
  };
}

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  code: string;
  isActive: boolean;
  createdAt: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  enrollments: {
    id: string;
    student: Student;
    joinedAt: string;
    isActive: boolean;
  }[];
  assignments: Assignment[];
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "assignments">("assignments");

  // State cho quản lý học sinh
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa lớp học này?")) return;

    try {
      const res = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/teacher/classes");
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError("Không thể xóa lớp");
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!studentEmail.trim()) return;

    setAddingStudent(true);
    setError("");
    try {
      const res = await fetch(`/api/classrooms/${id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: studentEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentEmail("");
        setShowAddStudent(false);
        fetchClassroom();
        alert("Đã thêm học sinh vào lớp!");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể thêm học sinh");
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleRemoveStudent(studentId: string, studentName: string) {
    if (!confirm(`Bạn có chắc muốn xóa "${studentName}" khỏi lớp?`)) return;

    setRemovingStudentId(studentId);
    setError("");
    try {
      const res = await fetch(`/api/classrooms/${id}/students?studentId=${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        fetchClassroom();
        alert("Đã xóa học sinh khỏi lớp!");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể xóa học sinh");
    } finally {
      setRemovingStudentId(null);
    }
  }

  function copyCode() {
    if (classroom) {
      navigator.clipboard.writeText(classroom.code);
      alert("Đã sao chép mã lớp!");
    }
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
        <Link href="/teacher/classes">
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  const activeStudents = classroom.enrollments.filter((e) => e.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/teacher/classes" className="text-gray-500 hover:text-gray-700">
              Lớp học
            </Link>
            <span className="text-gray-400">/</span>
            <span>{classroom.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          {classroom.subject && (
            <p className="text-gray-600">{classroom.subject}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDelete}>
            Xóa lớp
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Class Info Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500">Mã lớp</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                  {showCode ? classroom.code : "******"}
                </code>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  {showCode ? "Ẩn" : "Hiện"}
                </button>
                <button
                  onClick={copyCode}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Sao chép
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Học sinh</p>
              <p className="text-lg font-semibold">{activeStudents.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bài tập</p>
              <p className="text-lg font-semibold">{classroom.assignments.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <span
                className={`inline-block px-2 py-1 text-sm rounded ${
                  classroom.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {classroom.isActive ? "Đang hoạt động" : "Đã đóng"}
              </span>
            </div>
          </div>
          {classroom.description && (
            <p className="mt-4 text-gray-600">{classroom.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`pb-2 px-1 ${
              activeTab === "assignments"
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Bài tập ({classroom.assignments.length})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-2 px-1 ${
              activeTab === "students"
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Học sinh ({activeStudents.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách bài tập</h2>
            <Link href={`/teacher/classes/${id}/assignments/new`}>
              <Button>+ Tạo bài tập</Button>
            </Link>
          </div>

          {classroom.assignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500 mb-4">Chưa có bài tập nào</p>
                <Link href={`/teacher/classes/${id}/assignments/new`}>
                  <Button>Tạo bài tập đầu tiên</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {classroom.assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/teacher/classes/${id}/assignments/${assignment.id}`}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <div className="flex gap-3 text-sm text-gray-500 mt-1">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {assignment.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded ${
                                assignment.status === "OPEN"
                                  ? "bg-green-100 text-green-700"
                                  : assignment.status === "DRAFT"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {assignment.status === "OPEN"
                                ? "Đang mở"
                                : assignment.status === "DRAFT"
                                ? "Nháp"
                                : "Đã đóng"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-600">
                            {assignment._count.submissions} / {activeStudents.length} nộp bài
                          </p>
                          {assignment.deadline && (
                            <p className="text-gray-500">
                              Hạn: {new Date(assignment.deadline).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách học sinh</h2>
            <Button onClick={() => setShowAddStudent(!showAddStudent)}>
              {showAddStudent ? "Đóng" : "+ Thêm học sinh"}
            </Button>
          </div>

          {/* Form thêm học sinh */}
          {showAddStudent && (
            <Card>
              <CardContent className="py-4">
                <form onSubmit={handleAddStudent} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Nhập email học sinh..."
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={addingStudent}>
                    {addingStudent ? "Đang thêm..." : "Thêm"}
                  </Button>
                </form>
                <p className="text-sm text-gray-500 mt-2">
                  Học sinh phải đã đăng ký tài khoản với role STUDENT
                </p>
              </CardContent>
            </Card>
          )}

          {activeStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">
                  Chưa có học sinh nào tham gia lớp này
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Chia sẻ mã lớp <code className="bg-gray-100 px-2 py-0.5 rounded">{classroom.code}</code> cho học sinh hoặc thêm thủ công bằng email
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Họ tên
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Ngày tham gia
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeStudents.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{enrollment.student.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {enrollment.student.email}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(enrollment.joinedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveStudent(enrollment.student.id, enrollment.student.name)}
                            disabled={removingStudentId === enrollment.student.id}
                            className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                          >
                            {removingStudentId === enrollment.student.id ? "Đang xóa..." : "Xóa"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
