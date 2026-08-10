import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    const potential = url.searchParams.get('potential') || '';
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

    if (potential === 'high') {
      query['aiAnalysis.score'] = { $gte: 7 };
    } else if (potential === 'medium') {
      query['aiAnalysis.score'] = { $gte: 5, $lt: 7 };
    } else if (potential === 'low') {
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

    const [leads, total] = await Promise.all([
      Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Lead.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({ success: true, data: leads, total, totalPages, page }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi tải danh sách' },
      { status: 500 }
    );
  }
}
