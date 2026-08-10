/**
 * src/lib/fastapi.ts — Shared FastAPI Backend Connection Helper
 * 
 * Centralized helper for authenticating and calling the FastAPI backend
 * (ufm-chatbot-cotham) from Next.js API routes.
 */

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'ufm_cotham_api_key_2026'
const ADMIN_USER = process.env.FASTAPI_ADMIN_USER || 'ufm_admin'
const ADMIN_PASS = process.env.FASTAPI_ADMIN_PASS || 'ufm_admin_2026'

// Token in-memory cache
let cachedToken: string | null = null
let tokenExpiresAt = 0

/**
 * Get FastAPI auth token (cached, auto-refresh)
 */
export async function getFastApiToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: ADMIN_USER,
        password: ADMIN_PASS,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.access_token) {
        cachedToken = data.access_token
        tokenExpiresAt = Date.now() + ((data.expires_in_minutes || 1440) * 60 * 1000) - 60000
        return cachedToken
      }
    } else {
      console.warn('[fastapi] Token login failed status:', res.status, await res.text().catch(() => ''))
    }
  } catch (error) {
    console.error('[fastapi] Login error:', error)
  }

  return API_KEY // Fallback API key if auth token login fails
}

/**
 * Get standard headers for FastAPI requests
 */
export function getHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  }
}

/**
 * Proxy a request to FastAPI backend
 * Returns the parsed JSON response or throws an error.
 */
export async function fastApiRequest<T = any>(
  path: string,
  options: {
    method?: string
    body?: any
    timeout?: number
    headers?: Record<string, string>
  } = {}
): Promise<T> {
  const token = await getFastApiToken()
  if (!token) {
    throw new Error('Không thể kết nối đến AI Backend')
  }

  const { method = 'GET', body, timeout = 15000, headers: extraHeaders } = options
  const headers: Record<string, string> = {
    ...getHeaders(token),
    ...extraHeaders,
  }

  // Don't set Content-Type for FormData
  if (body instanceof FormData) {
    delete headers['Content-Type']
  }

  const res = await fetch(`${FASTAPI_URL}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let detail = `HTTP ${res.status}`
    try {
      const json = JSON.parse(text)
      detail = json.detail || json.message || detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }

  return res.json()
}

export { FASTAPI_URL, API_KEY }
