import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;
    const roleRedirect: Record<string, string> = {
      ADMIN: "/admin",
      MANAGER: "/manager",
      TEACHER: "/teacher",
      STUDENT: "/student",
    };

    // Admin routes
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleRedirect[role], req.url));
    }

    // Manager routes
    if (path.startsWith("/manager") && !["ADMIN", "MANAGER"].includes(role)) {
      return NextResponse.redirect(new URL(roleRedirect[role], req.url));
    }

    // Teacher routes
    if (path.startsWith("/teacher") && !["ADMIN", "TEACHER"].includes(role)) {
      return NextResponse.redirect(new URL(roleRedirect[role], req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/manager/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
