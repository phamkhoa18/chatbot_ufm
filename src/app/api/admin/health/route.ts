import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

// GET /api/admin/health — System health check
export async function GET() {
  try {
    const data = await fastApiRequest('/api/v1/health', { timeout: 5000 })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      data: { status: 'offline', error: error.message },
    })
  }
}

// POST /api/admin/health — Clear cache
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'clear-cache') {
      const data = await fastApiRequest('/api/v1/admin/clear-cache', {
        method: 'POST',
        timeout: 10000,
      })
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
