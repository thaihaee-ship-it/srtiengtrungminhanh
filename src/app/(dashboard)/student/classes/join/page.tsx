"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function JoinClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    message: string;
    classroom: { id: string; name: string; teacher: string };
  } | null>(null);
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tham gia lớp học");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">{success.message}</h2>
            <p className="text-gray-600 mb-4">
              Lớp: <strong>{success.classroom.name}</strong>
              <br />
              Giáo viên: {success.classroom.teacher}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href={`/student/classes/${success.classroom.id}`}>
                <Button>Vào lớp học</Button>
              </Link>
              <Link href="/student/classes">
                <Button variant="outline">Xem tất cả lớp</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Link
          href="/student/classes"
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Quay lại danh sách lớp
        </Link>
        <h1 className="text-2xl font-bold mt-2">Tham gia lớp học</h1>
        <p className="text-gray-600">Nhập mã lớp để tham gia</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mã lớp học</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                Mã lớp (6 ký tự)
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: ABC123"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Hỏi giáo viên để lấy mã lớp
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? "Đang xử lý..." : "Tham gia lớp"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
