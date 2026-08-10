/**
 * src/lib/auth.ts — JWT Authentication Helper
 * 
 * Handles JWT token creation/verification for admin sessions.
 * Tokens are signed by FastAPI backend, verified here using jose.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'change-me-in-production'
)

export interface AdminTokenPayload extends JWTPayload {
  sub: string  // username/email
  role: string // "super_admin" | "admin" | "viewer"
}

/**
 * Verify a JWT token (signed by FastAPI backend)
 * Returns the decoded payload or null if invalid/expired
 */
export async function verifyToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })
    return payload as AdminTokenPayload
  } catch {
    return null
  }
}

/**
 * Extract token from cookie value
 */
export function getTokenFromCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null
  return cookieValue
}

/**
 * Cookie name for admin JWT session
 */
export const ADMIN_SESSION_COOKIE = 'admin_session'

/**
 * Cookie options for secure JWT storage
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: parseInt(process.env.ADMIN_SESSION_MAX_AGE || '86400', 10),
  path: '/',
}
