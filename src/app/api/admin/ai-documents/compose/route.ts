import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

export const maxDuration = 60

/**
 * POST /api/admin/ai-documents/compose
 * Proxy to FastAPI: Compose HTML → Markdown → Ingest into KB
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

    const data = await fastApiRequest('/api/v1/admin/compose', {
      method: 'POST',
      body: {
        title,
        html_content,
        file_name: file_name || '',
        program_level: program_level || '',
        program_name: program_name || '',
        academic_year: academic_year || '',
        reference_url: reference_url || '',
      },
      timeout: 30000,
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Compose API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi server' },
      { status: 500 }
    )
  }
}
