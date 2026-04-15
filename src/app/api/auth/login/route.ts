import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, password } = await req.json();
    
    // Auto-seed default user if not exists
    const seedEmail = 'adminufm@gmail.com';
    let defaultAdmin = await Admin.findOne({ email: seedEmail });
    if (!defaultAdmin) {
      const hash = await bcrypt.hash('12345678', 10);
      defaultAdmin = await Admin.create({
        fullName: 'Admin Thạc Sĩ UFM',
        email: seedEmail,
        password: hash,
        role: 'superadmin'
      });
    }

    const admin = await Admin.findOne({ 
      $or: [{ email: username }, { username: username }] 
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Tài khoản không tồn tại' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Mật khẩu không chính xác' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, data: { id: admin._id, email: admin.email, fullName: admin.fullName } });
    
    // MOCK JWT or simple token (Since we don't have jose installed, we will just use the ID for simplicity in cookies, though it's not super secure for prod, it fulfills demo logic)
    response.cookies.set('admin_session', admin._id.toString(), {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
