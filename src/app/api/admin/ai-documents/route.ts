import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest, getFastApiToken, getHeaders, FASTAPI_URL, API_KEY } from '@/lib/fastapi'

export const maxDuration = 60

// Re-export for backward compatibility with compose/route.ts etc.
export { getFastApiToken, FASTAPI_URL }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const programLevel = formData.get('program_level') as string || ''
    const programName = formData.get('program_name') as string || ''
    const academicYear = formData.get('academic_year') as string || ''
    const referenceUrl = formData.get('reference_url') as string || ''

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có file nào được gửi' }, { status: 400 })
    }

    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Không thể kết nối đến AI Backend' }, { status: 502 })
    }

    const results = []

    for (const file of files) {
      const fastApiForm = new FormData()
      fastApiForm.append('files', file)
      if (programLevel) fastApiForm.append('program_level', programLevel)
      if (programName) fastApiForm.append('program_name', programName)
      if (academicYear) fastApiForm.append('academic_year', academicYear)
      if (referenceUrl) fastApiForm.append('reference_url', referenceUrl)

      try {
        const headers = getHeaders(token)
        delete headers['Content-Type'] // Let FormData set its own boundary

        const response = await fetch(`${FASTAPI_URL}/api/v1/admin/ingest`, {
          method: 'POST',
          headers,
          body: fastApiForm as any,
        })

        const rawText = await response.text()
        let data: any
        try {
          data = JSON.parse(rawText)
        } catch {
          throw new Error(`AI Backend trả về lỗi (HTTP ${response.status}). Task có thể đã được queue — kiểm tra tab Tasks.`)
        }

        if (!response.ok) {
          throw new Error(data.detail || 'Lỗi từ máy chủ AI')
        }

        const task = data.tasks?.[0]
        if (task && task.status === 'accepted') {
          results.push({ fileName: file.name, status: 'processing', task_id: task.task_id })
        } else {
          results.push({ fileName: file.name, status: 'error', reason: task?.reason || 'File bị từ chối' })
        }
      } catch (err: any) {
        console.error('FastAPI ingest error:', err)
        results.push({ fileName: file.name, status: 'error', reason: err.message || 'Lỗi gọi AI Backend' })
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getFastApiToken()

    let vectorDbDocs: any[] = []
    let vectorDbStats: any = null

    if (token) {
      try {
        const headers = getHeaders(token)
        const [docsRes, statsRes] = await Promise.all([
          fetch(`${FASTAPI_URL}/api/v1/admin/documents`, {
            headers,
            signal: AbortSignal.timeout(15_000),
          }),
          fetch(`${FASTAPI_URL}/api/v1/admin/documents/stats`, {
            headers,
            signal: AbortSignal.timeout(15_000),
          }),
        ])

        if (docsRes.ok) {
          try {
            const docsData = JSON.parse(await docsRes.text())
            vectorDbDocs = docsData.documents || []
          } catch { /* skip */ }
        }
        if (statsRes.ok) {
          try {
            vectorDbStats = JSON.parse(await statsRes.text())
          } catch { /* skip */ }
        }
      } catch (err) {
        console.error('FastAPI documents fetch error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        vectorDb: vectorDbDocs,
        stats: vectorDbStats,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get('file_name')

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'Thiếu file_name' }, { status: 400 })
    }

    const token = await getFastApiToken()
    let vectorDeleted = 0

    if (token) {
      try {
        const res = await fetch(
          `${FASTAPI_URL}/api/v1/admin/documents?file_name=${encodeURIComponent(fileName)}`,
          {
            method: 'DELETE',
            headers: getHeaders(token),
          }
        )
        if (res.ok) {
          const data = await res.json()
          vectorDeleted = data.chunks_deleted || 0
        }
      } catch (err) {
        console.error('FastAPI delete error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: { vector_chunks_deleted: vectorDeleted },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
