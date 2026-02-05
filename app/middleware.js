// middleware.js
import { NextResponse } from "next/server";
import { getSecurityHeaders } from "./lib/security-headers";
import { verifyToken } from "./lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access login/register, redirect to appropriate dashboard
  if (token && (pathname === "/login" || pathname === "/register")) {
    // Verify token and get user role
    const payload = await verifyToken(token);
    if (payload) {
      // Redirect based on role
      if (payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (payload.role === "staff") {
        return NextResponse.redirect(new URL("/staff", request.url));
      } else {
        return NextResponse.redirect(new URL("/user", request.url));
      }
    }
    // If token is invalid, continue to login page
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // For protected routes, verify role matches the route
  if (token && !isPublicRoute) {
    const payload = await verifyToken(token);

    if (!payload) {
      // Invalid token - redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Define role-specific routes
    const isAdminRoute =
      pathname.startsWith("/admin") || pathname.startsWith("/users");
    const isStaffRoute =
      pathname.startsWith("/staff") ||
      pathname === "/availability" ||
      pathname.startsWith("/staff-");
    const isUserRoute =
      pathname.startsWith("/user") ||
      pathname.startsWith("/my-appointments") ||
      pathname.startsWith("/appointments") ||
      pathname.startsWith("/providers");

    // Enforce role-based access
    if (isAdminRoute && payload.role !== "admin") {
      // Non-admin trying to access admin route - redirect to their dashboard
      if (payload.role === "staff") {
        return NextResponse.redirect(new URL("/staff", request.url));
      } else {
        return NextResponse.redirect(new URL("/user", request.url));
      }
    }

    if (isStaffRoute && payload.role !== "staff") {
      // Non-staff trying to access staff route
      if (payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/user", request.url));
      }
    }

    if (isUserRoute && payload.role !== "user") {
      // Non-user trying to access user route
      if (payload.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (payload.role === "staff") {
        return NextResponse.redirect(new URL("/staff", request.url));
      }
    }

    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response) {
  const headers = getSecurityHeaders();

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
