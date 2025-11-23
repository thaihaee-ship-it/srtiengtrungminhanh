"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/prisma";
import {
  Home,
  Users,
  BookOpen,
  ClipboardList,
  Settings,
  LogOut,
  GraduationCap,
  PenTool,
  FileText,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItemsByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { title: "Dashboard", href: "/admin", icon: <Home size={20} /> },
    { title: "Quản lý người dùng", href: "/admin/users", icon: <Users size={20} /> },
    { title: "Quản lý lớp học", href: "/admin/classes", icon: <BookOpen size={20} /> },
    { title: "Cài đặt", href: "/admin/settings", icon: <Settings size={20} /> },
  ],
  MANAGER: [
    { title: "Dashboard", href: "/manager", icon: <Home size={20} /> },
    { title: "Nội dung", href: "/manager/content", icon: <FileText size={20} /> },
  ],
  TEACHER: [
    { title: "Dashboard", href: "/teacher", icon: <Home size={20} /> },
    { title: "Lớp học của tôi", href: "/teacher/classes", icon: <BookOpen size={20} /> },
    { title: "Bài tập", href: "/teacher/assignments", icon: <ClipboardList size={20} /> },
    { title: "Chấm bài", href: "/teacher/grading", icon: <PenTool size={20} /> },
  ],
  STUDENT: [
    { title: "Dashboard", href: "/student", icon: <Home size={20} /> },
    { title: "Lớp học", href: "/student/classes", icon: <GraduationCap size={20} /> },
    { title: "Bài tập", href: "/student/assignments", icon: <ClipboardList size={20} /> },
    { title: "Kết quả", href: "/student/results", icon: <FileText size={20} /> },
  ],
};

interface SidebarProps {
  role: Role;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navItemsByRole[role] || [];

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">EduApp</h1>
      </div>

      <div className="border-b border-gray-800 p-4">
        <p className="text-sm text-gray-400">Xin chào,</p>
        <p className="font-medium truncate">{userName}</p>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-blue-600">
          {role === "ADMIN" && "Quản trị viên"}
          {role === "MANAGER" && "Quản lý nội dung"}
          {role === "TEACHER" && "Giáo viên"}
          {role === "STUDENT" && "Học sinh"}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
