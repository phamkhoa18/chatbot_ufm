import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: admins }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách người dùng' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { fullName, email, password } = await req.json();

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: 'Email hoặc tên đăng nhập đã tồn tại' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      fullName,
      email,
      username: email, // use email as username
      password: hashedPassword,
      role: 'admin'
    });

    return NextResponse.json({ success: true, message: 'Tạo tài khoản thành công' });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
