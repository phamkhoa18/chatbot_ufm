import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID khách hàng' }, { status: 400 });
    }

    const updates = await req.json();
    await connectDB();

    // Lọc ra các field cho phép update (status, isRead)
    const allowedUpdates: any = {};
    if (updates.status !== undefined) allowedUpdates.status = updates.status;
    if (updates.isRead !== undefined) allowedUpdates.isRead = updates.isRead;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ success: false, error: 'Dữ liệu cập nhật không hợp lệ' }, { status: 400 });
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, allowedUpdates, { new: true });
    
    if (!updatedLead) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedLead }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi khi cập nhật' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID khách hàng' }, { status: 400 });
    }

    await connectDB();
    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa khách hàng thành công' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi khi xóa' }, { status: 500 });
  }
}
