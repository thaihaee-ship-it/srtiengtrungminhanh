"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionOption {
  id: string;
  content: string;
}

interface Question {
  id: string;
  content: string;
  imageUrl: string | null;
  audioUrl: string | null;
  options: QuestionOption[];
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  deadline: string | null;
  questions: Question[];
  classroom: {
    id: string;
    name: string;
  };
}

interface SubmissionAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textContent: string | null;
}

interface ExistingSubmission {
  id: string;
  status: string;
  score: number | null;
  maxScore: number | null;
  answers: SubmissionAnswer[];
}

interface Answer {
  questionId: string;
  selectedOptionIds?: string[];
  textContent?: string;
}

export default function TakeAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id: classroomId, assignmentId } = use(params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<ExistingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  async function fetchAssignment() {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`);
      const data = await res.json();
      if (res.ok) {
        setAssignment(data.assignment);
        const assignmentType = data.assignment.type;

        if (data.submission) {
          setSubmission(data.submission);
          if (data.submission.status === "SUBMITTED" || data.submission.status === "GRADED") {
            setShowResult(true);
            if (assignmentType === "MCQ") {
              setResult({
                score: data.submission.score || 0,
                maxScore: data.submission.maxScore || 0,
              });
            }
          } else {
            // Khôi phục câu trả lời từ bản nháp
            setAnswers(
              data.submission.answers.map((a: SubmissionAnswer) => ({
                questionId: a.questionId,
                selectedOptionIds: a.selectedOptionIds || [],
                textContent: a.textContent || "",
              }))
            );
          }
        } else {
          // Khởi tạo câu trả lời rỗng
          setAnswers(
            data.assignment.questions.map((q: Question) => ({
              questionId: q.id,
              selectedOptionIds: [],
              textContent: "",
            }))
          );
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tải bài tập");
    } finally {
      setLoading(false);
    }
  }

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.questionId === questionId) {
          const selected = a.selectedOptionIds?.includes(optionId);
          return {
            ...a,
            selectedOptionIds: selected
              ? a.selectedOptionIds?.filter((id) => id !== optionId)
              : [...(a.selectedOptionIds || []), optionId],
          };
        }
        return a;
      })
    );
  }

  function updateTextAnswer(questionId: string, text: string) {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, textContent: text } : a))
    );
  }

  async function handleSubmit(isDraft: boolean) {
    if (!isDraft && !confirm("Bạn có chắc muốn nộp bài? Sau khi nộp sẽ không thể sửa.")) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, isDraft }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isDraft) {
          alert("Đã lưu nháp!");
        } else {
          setShowResult(true);
          if (assignment?.type === "MCQ") {
            setResult(data.score);
          }
        }
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể nộp bài");
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

  if (error || !assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Không tìm thấy bài tập"}</p>
        <Link href={`/student/classes/${classroomId}`}>
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  // Hiển thị kết quả sau khi nộp
  if (showResult) {
    if (assignment.type === "MCQ" && result) {
      const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
      return (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  percentage >= 80 ? "bg-green-100" : percentage >= 50 ? "bg-yellow-100" : "bg-red-100"
                }`}
              >
                <span
                  className={`text-3xl font-bold ${
                    percentage >= 80 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  {percentage}%
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Đã nộp bài!</h2>
              <p className="text-gray-600 mb-6">
                Bạn đạt <strong>{result.score}</strong> / {result.maxScore} câu đúng
              </p>
              <Link href={`/student/classes/${classroomId}`}>
                <Button>Quay lại lớp học</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Essay/Other types - chờ giáo viên chấm
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Đã nộp bài!</h2>
            <p className="text-gray-600 mb-2">Bài làm của bạn đã được gửi thành công.</p>
            <p className="text-gray-500 mb-6">Vui lòng chờ giáo viên chấm điểm.</p>
            {submission && submission.score !== null && (
              <p className="text-lg font-medium text-blue-600 mb-4">
                Điểm: {submission.score} / {submission.maxScore}
              </p>
            )}
            <Link href={`/student/classes/${classroomId}`}>
              <Button>Quay lại lớp học</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = assignment.questions[currentQuestion];
  const currentAnswer = answers.find((a) => a.questionId === question?.id);
  const answeredCount = answers.filter((a) =>
    (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
    (a.textContent && a.textContent.trim().length > 0)
  ).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/student/classes/${classroomId}`} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Quay lại lớp học
        </Link>
        <h1 className="text-2xl font-bold mt-2">{assignment.title}</h1>
        <p className="text-gray-600">
          {assignment.classroom.name} • {assignment.questions.length} câu hỏi •{" "}
          {assignment.type === "MCQ" ? "Trắc nghiệm" : assignment.type === "ESSAY" ? "Tự luận" : assignment.type}
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-4">
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span>Đã trả lời: {answeredCount} / {assignment.questions.length}</span>
            <div className="flex gap-1 flex-wrap">
              {assignment.questions.map((_, index) => {
                const ans = answers[index];
                const isAnswered = (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                                   (ans?.textContent && ans.textContent.trim().length > 0);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded text-sm font-medium ${
                      index === currentQuestion
                        ? "bg-blue-600 text-white"
                        : isAnswered
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      {question && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Câu {currentQuestion + 1}: {question.content}</CardTitle>
          </CardHeader>
          <CardContent>
            {question.imageUrl && <img src={question.imageUrl} alt="Question" className="mb-4 max-w-full rounded" />}
            {question.audioUrl && <audio controls src={question.audioUrl} className="mb-4 w-full" />}

            {/* MCQ Options */}
            {assignment.type === "MCQ" && (
              <div className="space-y-2">
                {question.options.map((option, index) => {
                  const isSelected = currentAnswer?.selectedOptionIds?.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => selectOption(question.id, option.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option.content}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Essay Text Area */}
            {assignment.type === "ESSAY" && (
              <div>
                <label className="block text-sm font-medium mb-2">Câu trả lời của bạn:</label>
                <textarea
                  value={currentAnswer?.textContent || ""}
                  onChange={(e) => updateTextAnswer(question.id, e.target.value)}
                  rows={10}
                  placeholder="Nhập câu trả lời..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Số ký tự: {currentAnswer?.textContent?.length || 0}</p>
              </div>
            )}

            {/* T/F on Document */}
            {assignment.type === "TF_ON_DOCUMENT" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Chọn TRUE hoặc FALSE cho phát biểu trên:</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateTextAnswer(question.id, "TRUE")}
                    className={`flex-1 p-4 rounded-lg border-2 font-medium transition-colors ${
                      currentAnswer?.textContent === "TRUE"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    TRUE (Đúng)
                  </button>
                  <button
                    onClick={() => updateTextAnswer(question.id, "FALSE")}
                    className={`flex-1 p-4 rounded-lg border-2 font-medium transition-colors ${
                      currentAnswer?.textContent === "FALSE"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                  >
                    FALSE (Sai)
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          Câu trước
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitting}>
            Lưu nháp
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.min(assignment.questions.length - 1, prev + 1))}
          disabled={currentQuestion === assignment.questions.length - 1}
        >
          Câu sau
        </Button>
      </div>
    </div>
  );
}
