import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Config from '@/models/Config';

export async function GET() {
  try {
    await connectDB();
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({});
    }
    return NextResponse.json({ success: true, data: config }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi tải cấu hình' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    let config = await Config.findOne();
    
    if (!config) {
      config = new Config(body);
    } else {
      Object.assign(config, body);
    }
    await config.save();
    
    return NextResponse.json({ success: true, data: config }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi cập nhật cấu hình' },
      { status: 500 }
    );
  }
}
