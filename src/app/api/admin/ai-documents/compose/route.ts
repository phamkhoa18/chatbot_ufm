import { NextRequest, NextResponse } from 'next/server'
import { getFastApiToken, FASTAPI_URL } from '../route'

export const maxDuration = 60

/**
 * POST /api/admin/ai-documents/compose
 * Proxy to FastAPI: Compose HTML → Gemini → Markdown → Ingest
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, html_content, file_name, program_level, program_name, academic_year, reference_url } = body

    if (!title || !html_content) {
      return NextResponse.json(
        { success: false, error: 'Tiêu đề và nội dung không được để trống' },
        { status: 400 }
      )
    }

    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối đến AI Backend' },
        { status: 502 }
      )
    }

    const response = await fetch(`${FASTAPI_URL}/api/v1/admin/compose`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        html_content,
        file_name: file_name || '',
        program_level: program_level || '',
        program_name: program_name || '',
        academic_year: academic_year || '',
        reference_url: reference_url || '',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Lỗi từ AI Backend' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Compose API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi server' },
      { status: 500 }
    )
  }
}
