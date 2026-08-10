import { NextRequest, NextResponse } from 'next/server'
import { fastApiRequest } from '@/lib/fastapi'

// CRM auth — FastAPI CRM uses X-CRM-Token header
async function getCrmToken(): Promise<string> {
  const data = await fastApiRequest<{ success: boolean; token: string }>('/api/v1/crm/login', {
    method: 'POST',
    body: { password: process.env.CRM_DASHBOARD_PASSWORD || 'ufm_crm_2026' },
  })
  return data.token
}

// GET /api/admin/crm — Dashboard stats OR leads list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'stats'

    const crmToken = await getCrmToken()

    if (type === 'leads') {
      const params = new URLSearchParams()
      for (const [key, val] of searchParams.entries()) {
        if (key !== 'type') params.set(key, val)
      }
      const data = await fastApiRequest(`/api/v1/crm/leads?${params}`, {
        headers: { 'X-CRM-Token': crmToken },
      })
      return NextResponse.json({ success: true, data })
    }

    if (type === 'analytics') {
      const data = await fastApiRequest('/api/v1/crm/analytics', {
        headers: { 'X-CRM-Token': crmToken },
      })
      return NextResponse.json({ success: true, data })
    }

    // Default: dashboard stats
    const data = await fastApiRequest('/api/v1/crm/dashboard/stats', {
      headers: { 'X-CRM-Token': crmToken },
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
