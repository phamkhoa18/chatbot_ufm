import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'Chưa đính kèm file' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Chuyển file sang chuỗi Base64
    const base64Data = buffer.toString('base64');
    
    // Header Data URI cho phép xem trước, và link api thật để Facebook thu thập
    const mimeType = file.type || 'image/png';
    const previewUrl = `data:${mimeType};base64,${base64Data}`;
    const fileUrl = `/api/og-image?t=${Date.now()}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl, 
      base64: base64Data,
      previewUrl: previewUrl,
      mimeType: mimeType
    }, { status: 200 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi biên dịch hình ảnh' },
      { status: 500 }
    );
  }
}
