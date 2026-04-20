import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db'
import AiDocument from '@/models/AiDocument'

// Set FastAPI backend URL, fallback to localhost
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000'
const ADMIN_USER = process.env.FASTAPI_ADMIN_USER || 'ufm_admin'
const ADMIN_PASS = process.env.FASTAPI_ADMIN_PASS || 'ufm_admin_2026'

// Token in-memory cache
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

// Re-export helper for other route files
export { getFastApiToken, FASTAPI_URL }

export const maxDuration = 60

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

    await connectToDatabase()

    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Không thể kết nối đến AI Backend' }, { status: 502 })
    }

    const results = []

    for (const file of files) {
      const doc = await AiDocument.create({
        fileName: file.name,
        fileSize: file.size,
        programLevel,
        programName,
        academicYear,
        referenceUrl,
        status: 'processing',
      })

      const fastApiForm = new FormData()
      fastApiForm.append('files', file)
      if (programLevel) fastApiForm.append('program_level', programLevel)
      if (programName) fastApiForm.append('program_name', programName)
      if (academicYear) fastApiForm.append('academic_year', academicYear)
      if (referenceUrl) fastApiForm.append('reference_url', referenceUrl)

      try {
        const response = await fetch(`${FASTAPI_URL}/api/v1/admin/ingest`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
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
          doc.fastApiTaskId = task.task_id
          await doc.save()
          results.push({ id: doc._id, fileName: file.name, status: 'processing', task_id: task.task_id })
        } else {
          doc.status = 'error'
          doc.errorMessage = task?.reason || 'File bị từ chối'
          await doc.save()
          results.push({ id: doc._id, fileName: file.name, status: 'error', reason: doc.errorMessage })
        }
      } catch (err: any) {
        console.error('Fastapi error:', err)
        doc.status = 'error'
        doc.errorMessage = err.message || 'Lỗi gọi AI Backend'
        await doc.save()
        results.push({ id: doc._id, fileName: file.name, status: 'error', reason: doc.errorMessage })
      }
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {

    // Fetch documents from FastAPI VectorDB (primary source of truth)
    const token = await getFastApiToken()
    
    let vectorDbDocs: any[] = []
    let vectorDbStats: any = null
    
    if (token) {
      try {
        const [docsRes, statsRes] = await Promise.all([
          fetch(`${FASTAPI_URL}/api/v1/admin/documents`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(15_000),
          }),
          fetch(`${FASTAPI_URL}/api/v1/admin/documents/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
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

    // Also fetch MongoDB records for cross-reference
    await connectToDatabase()
    const mongoDocs = await AiDocument.find()
      .sort({ createdAt: -1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      data: {
        vectorDb: vectorDbDocs,
        mongoDocs: JSON.parse(JSON.stringify(mongoDocs)),
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
    const mongoId = searchParams.get('id')

    if (!fileName && !mongoId) {
      return NextResponse.json({ success: false, error: 'Thiếu file_name hoặc id' }, { status: 400 })
    }

    // 1. Delete from FastAPI VectorDB
    let vectorDeleted = 0
    if (fileName) {
      const token = await getFastApiToken()
      if (token) {
        try {
          const res = await fetch(
            `${FASTAPI_URL}/api/v1/admin/documents?file_name=${encodeURIComponent(fileName)}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
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
    }

    // 2. Update MongoDB status
    if (mongoId) {
      await connectToDatabase()
      await AiDocument.findByIdAndUpdate(mongoId, { status: 'deleted' })
    }

    return NextResponse.json({
      success: true,
      data: {
        vector_chunks_deleted: vectorDeleted,
        mongo_updated: !!mongoId,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
