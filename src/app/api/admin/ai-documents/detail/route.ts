import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000'
const ADMIN_USER = process.env.FASTAPI_ADMIN_USER || 'ufm_admin'
const ADMIN_PASS = process.env.FASTAPI_ADMIN_PASS || 'ufm_admin_2026'

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

/**
 * GET /api/admin/ai-documents/detail?source=phuluc1.md
 * Proxy to FastAPI: GET /api/v1/admin/documents/detail?source=...
 */
export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url)
    const source = searchParams.get('source')
    
    if (!source) {
      return NextResponse.json({ success: false, error: 'Thiếu param source' }, { status: 400 })
    }

    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Không thể kết nối AI Backend' }, { status: 502 })
    }

    const res = await fetch(
      `${FASTAPI_URL}/api/v1/admin/documents/detail?source=${encodeURIComponent(source)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Lỗi từ FastAPI')
    }

    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
