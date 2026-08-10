import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

async function getCrmToken(): Promise<string> {
  const data = await fastApiRequest<{ success: boolean; token: string }>('/api/v1/crm/login', {
    method: 'POST',
    body: { password: process.env.CRM_DASHBOARD_PASSWORD || 'ufm_crm_2026' },
  })
  return data.token
}

// GET /api/admin/crm/[id] — Lead detail
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const crmToken = await getCrmToken()
    const data = await fastApiRequest(`/api/v1/crm/leads/${id}`, {
      headers: { 'X-CRM-Token': crmToken },
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH /api/admin/crm/[id] — Update lead (status, priority, assigned_to, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const crmToken = await getCrmToken()
    const data = await fastApiRequest(`/api/v1/crm/leads/${id}`, {
      method: 'PATCH',
      body,
      headers: { 'X-CRM-Token': crmToken },
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/admin/crm/[id] — Rescore lead
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    const crmToken = await getCrmToken()

    if (action === 'rescore') {
      const data = await fastApiRequest(`/api/v1/crm/leads/${id}/rescore`, {
        method: 'POST',
        headers: { 'X-CRM-Token': crmToken },
      })
      return NextResponse.json({ success: true, data })
    }

    // notes
    const body = await req.json()
    const data = await fastApiRequest(`/api/v1/crm/leads/${id}/notes`, {
      method: 'POST',
      body,
      headers: { 'X-CRM-Token': crmToken },
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
