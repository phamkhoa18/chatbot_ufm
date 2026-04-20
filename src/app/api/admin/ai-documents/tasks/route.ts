import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000'
const ADMIN_USER = process.env.FASTAPI_ADMIN_USER || 'ufm_admin'
const ADMIN_PASS = process.env.FASTAPI_ADMIN_PASS || 'ufm_admin_2026'

// Khởi tạo một hàm lấy token dùng chung (hoặc import từ utils nếu refactor sau)
let fastApiToken: string | null = null
let tokenExpiresAt = 0

async function getFastApiToken() {
  if (fastApiToken && Date.now() < tokenExpiresAt) {
    return fastApiToken
  }
  const formData = new URLSearchParams()
  formData.append('username', ADMIN_USER)
  formData.append('password', ADMIN_PASS)

  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.access_token) {
        fastApiToken = data.access_token
        tokenExpiresAt = Date.now() + (data.expires_in_minutes * 60 * 1000) - 60000
        return fastApiToken
      }
    }
  } catch (error) {
    console.error('FastAPI login error:', error)
  }
  return null
}

export async function GET(req: NextRequest) {
  try {

    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json({ success: true, data: [] }) // fallback rỗng nếu FastAPI tắt
    }

    const res = await fetch(`${FASTAPI_URL}/api/v1/admin/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    })
    
    const rawText = await res.text()
    let data: any
    try {
       data = JSON.parse(rawText)
    } catch {
       return NextResponse.json({ success: true, data: [] })
    }

    if (!res.ok) {
      throw new Error(data.detail || 'Lỗi từ máy chủ AI')
    }

    // data.tasks : list of { task_id, status, error, result... }
    return NextResponse.json({ success: true, data: data.tasks || [] })
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] })
  }
}

/**
 * POST /api/admin/ai-documents/tasks
 * Body: { task_id: string }
 * Cancel a task via FastAPI
 */
export async function POST(req: NextRequest) {
  try {

    const body = await req.json()
    const taskId = body.task_id
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'Thiếu task_id' }, { status: 400 })
    }

    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Không thể kết nối AI Backend' }, { status: 502 })
    }

    const res = await fetch(`${FASTAPI_URL}/api/v1/admin/tasks/${taskId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    const rawText = await res.text()
    try {
      const data = JSON.parse(rawText)
      return NextResponse.json({ success: true, data })
    } catch {
      return NextResponse.json({ success: false, error: 'Phản hồi từ FastAPI không hợp lệ' })
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
