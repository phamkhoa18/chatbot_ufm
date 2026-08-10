import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

// GET /api/admin/knowledge/embeddings — Vector DB stats
export async function GET() {
  try {
    const data = await fastApiRequest('/api/v1/knowledge/embeddings/stats')
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/admin/knowledge/embeddings — Reindex all
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'purge') {
      const data = await fastApiRequest('/api/v1/knowledge/embeddings/purge', {
        method: 'DELETE',
        timeout: 30000,
      })
      return NextResponse.json({ success: true, data })
    }

    // Default: reindex
    const data = await fastApiRequest('/api/v1/knowledge/embeddings/reindex', {
      method: 'POST',
      timeout: 60000,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/knowledge/embeddings — Purge all vectors
export async function DELETE() {
  try {
    const data = await fastApiRequest('/api/v1/knowledge/embeddings/purge', {
      method: 'DELETE',
      timeout: 30000,
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
