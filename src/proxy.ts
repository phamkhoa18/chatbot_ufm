import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminPage = pathname.startsWith('/admin');

  // Chưa login mà vào /admin → đá về /login
  if (!session && isAdminPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Đã login mà vào /login hoặc /register → đá về /admin
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register'],
};
