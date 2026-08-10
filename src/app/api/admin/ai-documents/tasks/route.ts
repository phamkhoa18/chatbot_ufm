import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

// GET /api/admin/ai-documents/tasks — List tasks from FastAPI
export async function GET() {
  try {
    const data = await fastApiRequest('/api/v1/admin/tasks')
    return NextResponse.json({ success: true, data: data.tasks || [] })
  } catch {
    return NextResponse.json({ success: true, data: [] }) // fallback empty if backend down
  }
}

// POST /api/admin/ai-documents/tasks — Cancel a task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const taskId = body.task_id
    if (!taskId) {
      return NextResponse.json({ success: false, error: 'Thiếu task_id' }, { status: 400 })
    }

    const data = await fastApiRequest(`/api/v1/admin/tasks/${taskId}/cancel`, { method: 'POST' })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
