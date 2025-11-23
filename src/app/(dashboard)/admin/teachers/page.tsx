"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form tao/sua giao vien
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      const res = await fetch("/api/admin/users?role=TEACHER");
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.users);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Khong the tai danh sach giao vien");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "" });
    setShowForm(true);
  }

  function openEditForm(teacher: User) {
    setEditingId(teacher.id);
    setFormData({ name: teacher.name, email: teacher.email, password: "" });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", password: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (editingId) {
        // Cap nhat
        const updateData: Record<string, string> = { name: formData.name, email: formData.email };
        if (formData.password) updateData.password = formData.password;

        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        const data = await res.json();

        if (res.ok) {
          closeForm();
          fetchTeachers();
          alert("Da cap nhat thong tin giao vien!");
        } else {
          setError(data.error);
        }
      } else {
        // Tao moi
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, role: "TEACHER" }),
        });
        const data = await res.json();

        if (res.ok) {
          closeForm();
          fetchTeachers();
          alert("Da tao tai khoan giao vien thanh cong!");
        } else {
          setError(data.error);
        }
      }
    } catch {
      setError("Khong the xu ly yeu cau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(teacher: User) {
    if (!confirm(`Ban co chac muon xoa giao vien "${teacher.name}"?`)) return;

    setDeletingId(teacher.id);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${teacher.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        fetchTeachers();
        alert("Da xoa giao vien!");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Khong the xoa giao vien");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(teacher: User) {
    const action = teacher.isActive ? "khoa" : "mo khoa";
    if (!confirm(`Ban co chac muon ${action} tai khoan "${teacher.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !teacher.isActive }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchTeachers();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Khong the cap nhat trang thai");
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
          <h1 className="text-2xl font-bold">Quan ly Giao vien</h1>
          <p className="text-gray-600">Tao va quan ly tai khoan giao vien</p>
        </div>
        <Button onClick={openCreateForm}>+ Them giao vien</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form tao/sua giao vien */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Sua thong tin giao vien" : "Tao tai khoan giao vien moi"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Ho va ten"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyen Van A"
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@example.com"
                required
              />
              <Input
                label={editingId ? "Mat khau moi (de trong neu khong doi)" : "Mat khau"}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Toi thieu 6 ky tu"
                required={!editingId}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Dang xu ly..." : editingId ? "Cap nhat" : "Tao tai khoan"}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Huy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Danh sach giao vien */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sach giao vien ({teachers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {teachers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Chua co giao vien nao. Nhan "+ Them giao vien" de tao moi.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ho ten</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ngay tao</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Trang thai</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{teacher.name}</td>
                    <td className="px-4 py-3 text-gray-600">{teacher.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(teacher.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(teacher)}
                        className={`px-2 py-1 text-xs rounded cursor-pointer ${
                          teacher.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {teacher.isActive ? "Hoat dong" : "Bi khoa"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditForm(teacher)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Sua
                      </button>
                      <button
                        onClick={() => handleDelete(teacher)}
                        disabled={deletingId === teacher.id}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        {deletingId === teacher.id ? "Dang xoa..." : "Xoa"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
