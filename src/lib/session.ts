import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";
import type { Role } from "@/types/prisma";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    const dashboardRoutes: Record<Role, string> = {
      ADMIN: "/admin",
      MANAGER: "/manager",
      TEACHER: "/teacher",
      STUDENT: "/student",
    };
    redirect(dashboardRoutes[user.role as Role] || "/");
  }
  return user;
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireTeacher() {
  return requireRole(["ADMIN", "TEACHER"]);
}

export async function requireStudent() {
  return requireRole(["ADMIN", "TEACHER", "STUDENT"]);
}
