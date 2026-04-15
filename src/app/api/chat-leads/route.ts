import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { fullName, email, phone } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: 'Bắt buộc nhập họ tên và số điện thoại' },
        { status: 400 }
      );
    }

    const lead = await Lead.create({
      fullName,
      email: email || '',
      phone,
      source: 'AI_Chatbot',
      status: 'New',
    });

    return NextResponse.json({ success: true, leadId: lead._id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Hệ thống đang bận, vui lòng thử lại sau ít phút hoặc nhập lại thông tin.' },
      { status: 500 }
    );
  }
}
