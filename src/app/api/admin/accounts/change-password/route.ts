import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { newPassword } = await req.json();
    
    // In nextjs 15 cookies() needs to be awaited if properties are used directly, but reading the sync `.get()` is fine historically, or await cookies().get()
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_session')?.value;

    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
