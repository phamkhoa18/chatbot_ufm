import AdminShell from '@/components/layout/AdminShell'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken, ADMIN_SESSION_COOKIE } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    redirect('/login')
  }

  const payload = await verifyToken(token)
  if (!payload) {
    redirect('/login')
  }

  const adminUser = {
    name: payload.sub || 'Admin',
    email: payload.sub || '',
    role: payload.role === 'super_admin' ? 'SUPER ADMIN' : payload.role === 'admin' ? 'ADMIN' : 'VIEWER',
  }

  return (
    <AdminShell user={adminUser}>
      {children}
    </AdminShell>
  )
}
