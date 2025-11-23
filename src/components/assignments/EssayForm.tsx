"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
  id: string;
  content: string;
  imageUrl: string | null;
  audioUrl: string | null;
}

interface EssayAnswer {
  questionId: string;
  textContent: string;
}

interface EssayFormProps {
  questions: Question[];
  initialAnswers?: EssayAnswer[];
  onSubmit: (answers: EssayAnswer[], isDraft: boolean) => Promise<void>;
  submitting: boolean;
}

export default function EssayForm({
  questions,
  initialAnswers = [],
  onSubmit,
  submitting,
}: EssayFormProps) {
  const [answers, setAnswers] = useState<EssayAnswer[]>(
    questions.map((q) => ({
      questionId: q.id,
      textContent: initialAnswers.find((a) => a.questionId === q.id)?.textContent || "",
    }))
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);

  function updateAnswer(questionId: string, textContent: string) {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, textContent } : a))
    );
  }

  const question = questions[currentQuestion];
  const currentAnswer = answers.find((a) => a.questionId === question?.id);
  const answeredCount = answers.filter((a) => a.textContent.trim().length > 0).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              Đã trả lời: {answeredCount} / {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, index) => {
                const isAnswered = answers[index]?.textContent.trim().length > 0;
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Câu {currentQuestion + 1}: {question.content}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question"
                className="mb-4 max-w-full rounded"
              />
            )}
            {question.audioUrl && (
              <audio controls src={question.audioUrl} className="mb-4 w-full" />
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Câu trả lời của bạn:</label>
              <textarea
                value={currentAnswer?.textContent || ""}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                rows={8}
                placeholder="Nhập câu trả lời..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Số ký tự: {currentAnswer?.textContent.length || 0}
              </p>
            </div>
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
          <Button
            variant="outline"
            onClick={() => onSubmit(answers, true)}
            disabled={submitting}
          >
            Lưu nháp
          </Button>
          <Button onClick={() => onSubmit(answers, false)} disabled={submitting}>
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))
          }
          disabled={currentQuestion === questions.length - 1}
        >
          Câu sau
        </Button>
      </div>
    </div>
  );
}
