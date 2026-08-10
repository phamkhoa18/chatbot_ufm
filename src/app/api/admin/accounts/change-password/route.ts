import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/auth'

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz'

// PUT /api/admin/accounts/change-password — Change own password
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập đầy đủ' }, { status: 400 })
    }

    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Lỗi đổi mật khẩu' },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
