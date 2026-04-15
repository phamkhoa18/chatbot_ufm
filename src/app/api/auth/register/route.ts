import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { fullName, username, email, password, secretKey } = await req.json();

    if (secretKey !== 'UFM2024') {
      return NextResponse.json({ success: false, error: 'Mã xác thực Admin không hợp lệ' }, { status: 403 });
    }

    const existingAdmin = await Admin.findOne({ 
      $or: [{ email: email || username }, { username: username }]
    });

    if (existingAdmin) {
      return NextResponse.json({ success: false, error: 'Tên đăng nhập hoặc Email đã tồn tại' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      fullName,
      email: email || username, // If email wasn't provided, fallback to username
      username: username,
      password: hashedPassword,
      role: 'admin'
    });

    return NextResponse.json({ success: true, message: 'Đăng ký thành công' });

  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
