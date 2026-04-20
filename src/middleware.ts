import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminPage = pathname.startsWith('/admin');
  const isApiAdmin = pathname.startsWith('/api/admin');

  // Chưa login mà vào /admin
  if (!session) {
    if (isApiAdmin) {
      return NextResponse.json({ success: false, error: 'Hết phiên đăng nhập' }, { status: 401 });
    }
    if (isAdminPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Đã login mà vào /login
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/login', '/register'],
};
