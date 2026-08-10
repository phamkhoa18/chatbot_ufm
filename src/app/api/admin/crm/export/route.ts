import { NextRequest, NextResponse } from 'next/server'
import { getFastApiToken, getHeaders, FASTAPI_URL } from '@/lib/fastapi'

// GET /api/admin/crm/export — Export leads as CSV
export async function GET(req: NextRequest) {
  try {
    const token = await getFastApiToken()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 502 })
    }

    const { searchParams } = new URL(req.url)
    const params = new URLSearchParams()
    if (searchParams.get('grade')) params.set('grade', searchParams.get('grade')!)
    if (searchParams.get('status')) params.set('status', searchParams.get('status')!)

    // CRM login
    const crmLoginRes = await fetch(`${FASTAPI_URL}/api/v1/crm/login`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ password: process.env.CRM_DASHBOARD_PASSWORD || 'ufm_crm_2026' }),
    })
    const crmLogin = await crmLoginRes.json()
    const crmToken = crmLogin.token

    const res = await fetch(`${FASTAPI_URL}/api/v1/crm/export/csv?${params}`, {
      headers: {
        ...getHeaders(token),
        'X-CRM-Token': crmToken,
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `HTTP ${res.status}` }, { status: res.status })
    }

    const csv = await res.text()
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=ufm_crm_leads.csv',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
