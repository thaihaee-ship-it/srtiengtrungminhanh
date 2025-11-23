"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Answer {
  id: string;
  questionId: string;
  textContent: string | null;
  audioUrl: string | null;
  selectedOptionIds: string[];
  score: number | null;
  maxScore: number | null;
}

interface Question {
  id: string;
  content: string;
  correctText: string | null;
}

interface Submission {
  id: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
  assignment: {
    id: string;
    title: string;
    type: string;
    classroom: {
      id: string;
      name: string;
    };
    questions: Question[];
  };
  answers: Answer[];
  feedback: {
    id: string;
    comment: string | null;
    teacher: { name: string };
  } | null;
}

export default function GradeSubmissionPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string; submissionId: string }>;
}) {
  const { id: classroomId, assignmentId, submissionId } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [gradeData, setGradeData] = useState({
    score: 0,
    maxScore: 10,
    feedback: "",
  });

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  async function fetchSubmission() {
    try {
      const res = await fetch(`/api/submissions/${submissionId}`);
      const data = await res.json();
      if (res.ok) {
        setSubmission(data.submission);
        if (data.submission.score !== null) {
          setGradeData({
            score: data.submission.score,
            maxScore: data.submission.maxScore || 10,
            feedback: data.submission.feedback?.comment || "",
          });
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tải bài nộp");
    } finally {
      setLoading(false);
    }
  }

  async function handleGrade() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gradeData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Đã chấm điểm thành công!");
        router.push(`/teacher/classes/${classroomId}/assignments/${assignmentId}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể chấm điểm");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Không tìm thấy bài nộp"}</p>
        <Link href={`/teacher/classes/${classroomId}/assignments/${assignmentId}`}>
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
            {submission.assignment.classroom.name}
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/teacher/classes/${classroomId}/assignments/${assignmentId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            {submission.assignment.title}
          </Link>
          <span className="text-gray-400">/</span>
          <span>Chấm bài</span>
        </div>
        <h1 className="text-2xl font-bold">Chấm bài: {submission.student.name}</h1>
        <p className="text-gray-600">{submission.student.email}</p>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-500">Trạng thái</p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-sm ${
                  submission.status === "GRADED"
                    ? "bg-blue-100 text-blue-700"
                    : submission.status === "SUBMITTED"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {submission.status === "GRADED"
                  ? "Đã chấm"
                  : submission.status === "SUBMITTED"
                  ? "Đã nộp"
                  : "Đang làm"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Thời gian nộp</p>
              <p className="font-medium">
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString("vi-VN")
                  : "-"}
              </p>
            </div>
            {submission.gradedAt && (
              <div>
                <p className="text-sm text-gray-500">Thời gian chấm</p>
                <p className="font-medium">
                  {new Date(submission.gradedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Bài làm của học sinh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {submission.assignment.questions.map((question, index) => {
            const answer = submission.answers.find((a) => a.questionId === question.id);
            return (
              <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">
                  Câu {index + 1}: {question.content}
                </p>

                {/* Essay Answer */}
                {submission.assignment.type === "ESSAY" && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Câu trả lời:</p>
                    <div className="bg-white p-3 rounded border whitespace-pre-wrap">
                      {answer?.textContent || (
                        <span className="text-gray-400 italic">Chưa trả lời</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Answer */}
                {answer?.audioUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Audio:</p>
                    <audio controls src={answer.audioUrl} className="w-full" />
                  </div>
                )}

                {/* Correct Answer (for reference) */}
                {question.correctText && (
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>Đáp án mẫu:</strong> {question.correctText}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Grading Form */}
      <Card>
        <CardHeader>
          <CardTitle>Chấm điểm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Điểm</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={gradeData.maxScore}
                  step={0.5}
                  value={gradeData.score}
                  onChange={(e) =>
                    setGradeData({ ...gradeData, score: parseFloat(e.target.value) || 0 })
                  }
                  className="w-24"
                />
                <span className="text-gray-500">/</span>
                <Input
                  type="number"
                  min={1}
                  value={gradeData.maxScore}
                  onChange={(e) =>
                    setGradeData({ ...gradeData, maxScore: parseFloat(e.target.value) || 10 })
                  }
                  className="w-24"
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Tỷ lệ</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((gradeData.score / gradeData.maxScore) * 100)}%
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nhận xét</label>
            <textarea
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              rows={4}
              placeholder="Nhận xét cho học sinh..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleGrade} disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu điểm"}
            </Button>
            <Link href={`/teacher/classes/${classroomId}/assignments/${assignmentId}`}>
              <Button variant="outline">Hủy</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
