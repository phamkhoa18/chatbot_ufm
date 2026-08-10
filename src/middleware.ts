import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'change-me-in-production'
)

const ADMIN_SESSION_COOKIE = 'admin_session'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const { pathname } = request.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isAdminPage = pathname.startsWith('/admin')
  const isApiAdmin = pathname.startsWith('/api/admin')

  // Verify JWT token (not just cookie existence)
  let isValidSession = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] })
      isValidSession = true
    } catch {
      // Token expired or invalid — clear cookie
      if (isAdminPage) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete(ADMIN_SESSION_COOKIE)
        return response
      }
    }
  }

  // Not logged in → redirect/reject
  if (!isValidSession) {
    if (isApiAdmin) {
      return NextResponse.json(
        { success: false, error: 'Hết phiên đăng nhập' },
        { status: 401 }
      )
    }
    if (isAdminPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Already logged in → redirect away from login page
  if (isValidSession && isAuthPage) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/login', '/register'],
}
