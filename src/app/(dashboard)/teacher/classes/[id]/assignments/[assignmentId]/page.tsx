"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Submission {
  id: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface Question {
  id: string;
  content: string;
  options: {
    id: string;
    content: string;
    isCorrect: boolean;
  }[];
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  classroom: {
    id: string;
    name: string;
  };
  questions: Question[];
  _count: {
    submissions: number;
  };
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id: classroomId, assignmentId } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "submissions">("overview");

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  async function fetchAssignment() {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      const data = await res.json();
      if (res.ok) {
        setAssignment(data.assignment);
        setSubmissions(data.submissions || []);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tải bài tập");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchAssignment();
      }
    } catch {
      setError("Không thể cập nhật trạng thái");
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa bài tập này?")) return;

    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/teacher/classes/${classroomId}`);
      }
    } catch {
      setError("Không thể xóa bài tập");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Không tìm thấy bài tập"}</p>
        <Link href={`/teacher/classes/${classroomId}`}>
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  const submittedCount = submissions.filter((s) => s.status === "SUBMITTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Link href="/teacher/classes" className="text-gray-500 hover:text-gray-700">
              Lớp học
            </Link>
            <span className="text-gray-400">/</span>
            <Link
              href={`/teacher/classes/${classroomId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              {assignment.classroom.name}
            </Link>
            <span className="text-gray-400">/</span>
            <span>{assignment.title}</span>
          </div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
              {assignment.type === "MCQ" ? "Trắc nghiệm" : assignment.type}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-sm ${
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
        <div className="flex gap-2">
          {assignment.status === "DRAFT" && (
            <Button onClick={() => updateStatus("OPEN")}>Mở bài tập</Button>
          )}
          {assignment.status === "OPEN" && (
            <Button variant="outline" onClick={() => updateStatus("CLOSED")}>
              Đóng bài tập
            </Button>
          )}
          <Button variant="outline" onClick={handleDelete}>
            Xóa
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500">Số câu hỏi</p>
              <p className="text-lg font-semibold">{assignment.questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã nộp</p>
              <p className="text-lg font-semibold">{submittedCount}</p>
            </div>
            {assignment.deadline && (
              <div>
                <p className="text-sm text-gray-500">Hạn nộp</p>
                <p className="text-lg font-semibold">
                  {new Date(assignment.deadline).toLocaleDateString("vi-VN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-1 ${
              activeTab === "overview"
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`pb-2 px-1 ${
              activeTab === "submissions"
                ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                : "text-gray-500"
            }`}
          >
            Bài nộp ({submissions.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {assignment.description && (
            <Card>
              <CardHeader>
                <CardTitle>Mô tả</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{assignment.description}</p>
              </CardContent>
            </Card>
          )}

          {assignment.type === "MCQ" && assignment.questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Câu hỏi ({assignment.questions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.questions.map((question, index) => (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-2">
                      Câu {index + 1}: {question.content}
                    </p>
                    <div className="space-y-1 ml-4">
                      {question.options.map((opt, optIndex) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 ${
                            opt.isCorrect ? "text-green-600 font-medium" : ""
                          }`}
                        >
                          <span>{String.fromCharCode(65 + optIndex)}.</span>
                          <span>{opt.content}</span>
                          {opt.isCorrect && <span className="text-xs">(Đúng)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">Chưa có học sinh nào nộp bài</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Học sinh
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Trạng thái
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Điểm
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Thời gian nộp
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{sub.student.name}</p>
                          <p className="text-sm text-gray-500">{sub.student.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-sm ${
                              sub.status === "SUBMITTED"
                                ? "bg-green-100 text-green-700"
                                : sub.status === "GRADED"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {sub.status === "SUBMITTED"
                              ? "Đã nộp"
                              : sub.status === "GRADED"
                              ? "Đã chấm"
                              : "Đang làm"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {sub.score !== null && sub.maxScore !== null ? (
                            <span className="font-medium">
                              {sub.score} / {sub.maxScore}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleString("vi-VN")
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {sub.status !== "IN_PROGRESS" && (
                            <Link
                              href={`/teacher/classes/${classroomId}/assignments/${assignmentId}/submissions/${sub.id}`}
                            >
                              <Button size="sm" variant="outline">
                                {sub.status === "GRADED" ? "Xem/Sửa điểm" : "Chấm điểm"}
                              </Button>
                            </Link>
                          )}
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
