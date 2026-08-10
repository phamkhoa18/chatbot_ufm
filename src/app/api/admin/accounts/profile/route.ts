import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/auth'

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz'

// GET /api/admin/accounts/profile — Get current user profile
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Lỗi' }, { status: res.status })
    }

    return NextResponse.json({
      success: true,
      data: {
        fullName: data.full_name,
        email: data.username,
        role: data.role,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/accounts/profile — Update profile (placeholder)
export async function PUT(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Profile updated' })
}
