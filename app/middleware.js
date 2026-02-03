// middleware.js
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const userId = request.cookies.get('userId')?.value;

  // Public routes that don't need authentication
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If no userId and trying to access protected route, redirect to login
  if (!userId && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login/register, redirect to appropriate dashboard
  if (userId && (pathname === '/login' || pathname === '/register')) {
    // We need to check role, but we can't do database queries in middleware
    // So we'll let the page handle the redirect based on role
    return NextResponse.next();
  }

  // For protected routes, we need to verify the user's role matches the route
  // Since we can't do DB queries in Edge middleware, we'll use API route checking
  if (userId && !isPublicRoute) {
    // Check if user is trying to access role-specific routes
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/users');
    const isStaffRoute = pathname.startsWith('/staff') || pathname === '/availability';
    const isUserRoute = pathname.startsWith('/user') || 
                       pathname.startsWith('/my-appointments') || 
                       pathname.startsWith('/appointments') ||
                       pathname.startsWith('/providers');

    // We'll verify role authorization on the page itself
    // This middleware just ensures authentication
    return NextResponse.next();
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
