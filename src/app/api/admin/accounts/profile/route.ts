import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    await connectDB();
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_session')?.value;

    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: admin });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { fullName, email } = await req.json();
    
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_session')?.value;

    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    if (fullName) admin.fullName = fullName;
    if (email) {
      // Check if email relates to another user
      const exist = await Admin.findOne({ email, _id: { $ne: adminId } });
      if (exist) {
        return NextResponse.json({ success: false, error: 'Email đã được sử dụng bởi người khác' }, { status: 400 });
      }
      admin.email = email;
      admin.username = email;
    }

    await admin.save();

    return NextResponse.json({ success: true, data: { fullName: admin.fullName, email: admin.email }, message: 'Cập nhật hồ sơ thành công' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
