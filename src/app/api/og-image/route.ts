import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Config from '@/models/Config';

export async function GET(req: Request) {
  try {
    await connectDB();
    const config = await Config.findOne();
    
    if (config && config.seoOgImageBase64) {
      // Xác định mimeType từ chuỗi base64 nếu có, nếu không thì mặc định là image/png
      // Thường chúng ta chỉ lưu body base64, còn data uri ở frontend.
      const buffer = Buffer.from(config.seoOgImageBase64, 'base64');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png', // Hoặc mime map cụ thể nếu cần
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Nếu không có hình ảnh trong DB thì chuyển hướng tới default fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/images/seo_cover.png', baseUrl));
  } catch (error) {
    console.error('Error serving OG Image:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/images/seo_cover.png', baseUrl));
  }
}
