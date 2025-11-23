"use client";

import { useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionOption {
  content: string;
  isCorrect: boolean;
}

interface Question {
  content: string;
  options: QuestionOption[];
  correctAnswer?: boolean; // For T/F questions
}

interface TFStatement {
  content: string;
  isTrue: boolean;
}

interface AttachmentFile {
  url: string;
  fileName: string;
  fileType: string;
}

const ASSIGNMENT_TYPES = [
  { value: "MCQ", label: "Trắc nghiệm", description: "Câu hỏi nhiều lựa chọn" },
  { value: "ESSAY", label: "Tự luận", description: "Học sinh viết câu trả lời" },
  { value: "PRONUNCIATION", label: "Phát âm", description: "Luyện phát âm với AI" },
  { value: "TRANSLATION_SPEAKING", label: "Dịch & Nói", description: "Dịch và đọc to" },
  { value: "TF_ON_DOCUMENT", label: "Đúng/Sai trên tài liệu", description: "Đánh dấu đúng sai trên tài liệu" },
];

export default function CreateAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: classroomId } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    deadline: "",
  });

  // Attachments for all assignment types
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // For MCQ
  const [questions, setQuestions] = useState<Question[]>([
    { content: "", options: [{ content: "", isCorrect: false }] },
  ]);

  // For T/F on Document
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [tfStatements, setTfStatements] = useState<TFStatement[]>([
    { content: "", isTrue: true },
  ]);

  // Attachment upload functions
  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAttachment(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          setAttachments((prev) => [...prev, { url: data.url, fileName: data.fileName, fileType: data.fileType }]);
        } else {
          setError(data.error);
        }
      }
    } catch {
      setError("Không thể upload file");
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith("audio/")) {
      return <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    }
    if (fileType === "application/pdf") {
      return <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
    if (fileType.startsWith("image/")) {
      return <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    }
    return <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  }

  // MCQ Functions
  function addQuestion() {
    setQuestions([
      ...questions,
      { content: "", options: [{ content: "", isCorrect: false }] },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  }

  function updateQuestion(index: number, content: string) {
    const newQuestions = [...questions];
    newQuestions[index].content = content;
    setQuestions(newQuestions);
  }

  function addOption(questionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ content: "", isCorrect: false });
    setQuestions(newQuestions);
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length > 1) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
        (_, i) => i !== optionIndex
      );
      setQuestions(newQuestions);
    }
  }

  function updateOption(questionIndex: number, optionIndex: number, content: string) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].content = content;
    setQuestions(newQuestions);
  }

  function toggleCorrect(questionIndex: number, optionIndex: number) {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].isCorrect =
      !newQuestions[questionIndex].options[optionIndex].isCorrect;
    setQuestions(newQuestions);
  }

  // T/F on Document Functions
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setDocumentUrl(data.url);
        setDocumentName(data.fileName);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể upload file");
    } finally {
      setUploading(false);
    }
  }

  function addTFStatement() {
    setTfStatements([...tfStatements, { content: "", isTrue: true }]);
  }

  function removeTFStatement(index: number) {
    if (tfStatements.length > 1) {
      setTfStatements(tfStatements.filter((_, i) => i !== index));
    }
  }

  function updateTFStatement(index: number, content: string) {
    const newStatements = [...tfStatements];
    newStatements[index].content = content;
    setTfStatements(newStatements);
  }

  function toggleTFAnswer(index: number) {
    const newStatements = [...tfStatements];
    newStatements[index].isTrue = !newStatements[index].isTrue;
    setTfStatements(newStatements);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        ...formData,
        classroomId,
        attachments,
      };

      if (formData.type === "MCQ") {
        payload.questions = questions;
      } else if (formData.type === "TF_ON_DOCUMENT") {
        // Tạo questions từ T/F statements
        payload.questions = tfStatements.map((stmt) => ({
          content: stmt.content,
          correctText: stmt.isTrue ? "TRUE" : "FALSE",
          imageUrl: documentUrl, // Attach document to first question
        }));
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/teacher/classes/${classroomId}/assignments/${data.assignment.id}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Không thể tạo bài tập");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/teacher/classes/${classroomId}`}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Quay lại lớp học
        </Link>
        <h1 className="text-2xl font-bold mt-2">Tạo bài tập mới</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tiêu đề bài tập <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Bài kiểm tra Unit 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả về bài tập..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hạn nộp</label>
              <Input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Loại bài tập <span className="text-red-500">*</span>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {ASSIGNMENT_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "hover:border-gray-400"
                    }`}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* File Attachments */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">File đính kèm (tùy chọn)</label>
              <p className="text-xs text-gray-500 mb-3">Tải lên tài liệu (PDF, ảnh) hoặc file audio. Tối đa 10MB/file.</p>
              <input ref={attachmentInputRef} type="file" accept="image/*,.pdf" onChange={handleAttachmentUpload} className="hidden" multiple />
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAttachmentUpload} className="hidden" multiple />
              <div className="flex gap-2 mb-3">
                <Button type="button" variant="outline" size="sm" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingAttachment}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Tài liệu
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => audioInputRef.current?.click()} disabled={uploadingAttachment}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  Audio
                </Button>
                {uploadingAttachment && <div className="flex items-center gap-2 text-sm text-gray-500"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>Đang tải...</div>}
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.fileType)}
                        <div>
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-gray-500">{file.fileType.startsWith("audio/") ? "Audio" : file.fileType === "application/pdf" ? "PDF" : "Hình ảnh"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.fileType.startsWith("audio/") && <audio controls className="h-8 max-w-[150px]"><source src={file.url} type={file.fileType} /></audio>}
                        {file.fileType.startsWith("image/") && <img src={file.url} alt={file.fileName} className="h-10 w-10 object-cover rounded" />}
                        <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.type}
              >
                Tiếp tục
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: MCQ Questions */}
      {step === 2 && formData.type === "MCQ" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Câu hỏi trắc nghiệm</CardTitle>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  + Thêm câu hỏi
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-medium">Câu {qIndex + 1}</span>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <Input
                    value={question.content}
                    onChange={(e) => updateQuestion(qIndex, e.target.value)}
                    placeholder="Nhập câu hỏi..."
                    className="mb-3"
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Đáp án:</span>
                      <button
                        onClick={() => addOption(qIndex)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Thêm đáp án
                      </button>
                    </div>

                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={() => toggleCorrect(qIndex, oIndex)}
                          className="w-4 h-4 text-green-600"
                          title="Đánh dấu đáp án đúng"
                        />
                        <Input
                          value={option.content}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Đáp án ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1"
                        />
                        {question.options.length > 1 && (
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Tick vào ô vuông để đánh dấu đáp án đúng
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Quay lại
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo bài tập"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: T/F on Document */}
      {step === 2 && formData.type === "TF_ON_DOCUMENT" && (
        <div className="space-y-4">
          {/* Upload Document */}
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!documentUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Đang upload...</span>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Click để upload tài liệu (ảnh hoặc PDF)
                      </p>
                      <p className="text-xs text-gray-400">Tối đa 10MB</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-8 w-8 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{documentName}</p>
                      <p className="text-sm text-gray-500">Đã upload thành công</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDocumentUrl("");
                      setDocumentName("");
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </div>
              )}

              {documentUrl && documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Xem trước:</p>
                  <img
                    src={documentUrl}
                    alt="Preview"
                    className="max-h-64 rounded border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* T/F Statements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Các câu Đúng/Sai</CardTitle>
                <Button variant="outline" size="sm" onClick={addTFStatement}>
                  + Thêm câu
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Nhập các phát biểu và đánh dấu đáp án đúng (TRUE) hoặc sai (FALSE)
              </p>

              {tfStatements.map((stmt, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <span className="font-medium text-gray-500 pt-2">{index + 1}.</span>
                  <div className="flex-1">
                    <Input
                      value={stmt.content}
                      onChange={(e) => updateTFStatement(index, e.target.value)}
                      placeholder="Nhập phát biểu..."
                      className="mb-2"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf-${index}`}
                          checked={stmt.isTrue}
                          onChange={() => {
                            const newStmts = [...tfStatements];
                            newStmts[index].isTrue = true;
                            setTfStatements(newStmts);
                          }}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-green-600 font-medium">TRUE</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf-${index}`}
                          checked={!stmt.isTrue}
                          onChange={() => {
                            const newStmts = [...tfStatements];
                            newStmts[index].isTrue = false;
                            setTfStatements(newStmts);
                          }}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-red-600 font-medium">FALSE</span>
                      </label>
                    </div>
                  </div>
                  {tfStatements.length > 1 && (
                    <button
                      onClick={() => removeTFStatement(index)}
                      className="text-red-500 hover:text-red-700 pt-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Quay lại
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !documentUrl || tfStatements.some((s) => !s.content.trim())}
            >
              {loading ? "Đang tạo..." : "Tạo bài tập"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: For Essay and other types */}
      {step === 2 && !["MCQ", "TF_ON_DOCUMENT"].includes(formData.type) && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-4">
              Bài tập loại <strong>{ASSIGNMENT_TYPES.find((t) => t.value === formData.type)?.label}</strong> sẽ được
              tạo. Học sinh sẽ nộp bài theo dạng tương ứng.
            </p>
            {attachments.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">Đã đính kèm {attachments.length} file</p>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Quay lại
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo bài tập"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
