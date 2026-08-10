import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const potentialFilter = url.searchParams.get('potential') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';

    const query: any = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    if (potentialFilter === 'high') {
      query['aiAnalysis.score'] = { $gte: 7 };
    } else if (potentialFilter === 'medium') {
      query['aiAnalysis.score'] = { $gte: 5, $lt: 7 };
    } else if (potentialFilter === 'low') {
      query['aiAnalysis.score'] = { $lt: 5 };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 }).lean();

    // Tạo nội dung CSV chuẩn UTF-8 có BOM (Byte Order Mark) để Excel mở không bị lỗi phông chữ Tiếng Việt
    const headers = [
      'STT',
      'Họ và tên',
      'Số điện thoại',
      'Email',
      'Đánh giá AI (Mức độ)',
      'Điểm tiềm năng (1-10)',
      'Ngành học quan tâm',
      'Tóm tắt nhu cầu (AI)',
      'Trạng thái xử lý',
      'Ngày đăng ký'
    ];

    const rows = leads.map((lead: any, index: number) => {
      const isHigh = (lead.aiAnalysis?.score || 0) >= 7;
      const isMed = (lead.aiAnalysis?.score || 0) >= 5 && (lead.aiAnalysis?.score || 0) < 7;
      const potentialText = isHigh ? 'Tiềm năng Cao' : isMed ? 'Trung bình' : 'Ít tiềm năng';
      
      const programs = (lead.aiAnalysis?.interestedPrograms || []).join('; ');
      const summary = (lead.aiAnalysis?.summary || '').replace(/"/g, '""');
      const createdAt = lead.createdAt ? new Date(lead.createdAt).toLocaleString('vi-VN') : '';

      return [
        index + 1,
        `"${(lead.fullName || '').replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${potentialText}"`,
        lead.aiAnalysis?.score || 0,
        `"${programs.replace(/"/g, '""')}"`,
        `"${summary}"`,
        `"${lead.status || 'New'}"`,
        `"${createdAt}"`
      ].join(',');
    });

    // UTF-8 BOM: \uFEFF
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=danh_sach_khach_hang_tiem_nang_${Date.now()}.csv`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting leads CSV:', error);
    return NextResponse.json({ success: false, error: 'Lỗi xuất file CSV' }, { status: 500 });
  }
}
