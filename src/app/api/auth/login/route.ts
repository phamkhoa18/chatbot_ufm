import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Proxy login to FastAPI backend
    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(10000),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Sai thông tin đăng nhập' },
        { status: 401 }
      )
    }

    // Store JWT in httpOnly cookie
    const response = NextResponse.json({
      success: true,
      data: data.user,
    })

    response.cookies.set(ADMIN_SESSION_COOKIE, data.access_token, SESSION_COOKIE_OPTIONS)

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Không thể kết nối đến hệ thống xác thực' },
      { status: 502 }
    )
  }
}
