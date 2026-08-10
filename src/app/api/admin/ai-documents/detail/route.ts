import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

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

    const data = await fastApiRequest(`/api/v1/admin/documents/detail?source=${encodeURIComponent(source)}`)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
