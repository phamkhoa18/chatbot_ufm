'use client';

import AdminShell from '@/components/layout/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = {
    name: 'Admin UFM',
    role: 'ADMIN',
    email: 'admin@ufm.edu.vn',
  };

  return (
    <AdminShell user={adminUser}>
      {children}
    </AdminShell>
  );
}
