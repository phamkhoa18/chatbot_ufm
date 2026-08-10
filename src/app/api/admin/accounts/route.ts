import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/auth'

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz'

function getAuthHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value || ''
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// GET /api/admin/accounts — List all admin users
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/users`, {
      headers: getAuthHeaders(req),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Lỗi' }, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/admin/accounts — Create new admin user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payload = {
      username: body.email || body.username,
      password: body.password,
      full_name: body.fullName || body.full_name || body.email,
      role: body.role || 'admin',
    }
    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/users`, {
      method: 'POST',
      headers: getAuthHeaders(req),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Lỗi tạo tài khoản' }, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/accounts — Delete admin user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('id')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 })
    }
    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(req),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.detail || 'Lỗi xóa' }, { status: res.status })
    }
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
