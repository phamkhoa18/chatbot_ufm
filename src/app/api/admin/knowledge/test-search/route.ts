import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

// POST /api/admin/knowledge/test-search — Test search quality
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await fastApiRequest('/api/v1/knowledge/embeddings/test', {
      method: 'POST',
      body: {
        query: body.query || '',
        top_k: body.top_k || 10,
        level: body.level || null,
        major: body.major || null,
      },
      timeout: 15000,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
