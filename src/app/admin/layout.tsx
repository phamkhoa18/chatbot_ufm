import AdminShell from '@/components/layout/AdminShell';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connectDB();
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_session')?.value;

  if (!adminId) {
    redirect('/login');
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    redirect('/login');
  }

  const adminUser = {
    name: admin.fullName,
    email: admin.email,
    role: admin.role === 'superadmin' ? 'SUPER ADMIN' : 'ADMIN',
  };

  return (
    <AdminShell user={adminUser}>
      {children}
    </AdminShell>
  );
}
