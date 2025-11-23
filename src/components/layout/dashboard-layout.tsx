import { ReactNode } from "react";
import Sidebar from "./sidebar";
import type { Role } from "@/types/prisma";

interface DashboardLayoutProps {
  children: ReactNode;
  role: Role;
  userName: string;
}

export default function DashboardLayout({
  children,
  role,
  userName,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={role} userName={userName} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
