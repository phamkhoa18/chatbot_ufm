import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';

// GET /api/admin/sessions — List all chat sessions
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const flagged = searchParams.get('flagged');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const query: any = {};

    if (status) query.status = status;
    if (flagged === 'true') query.flagged = true;

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { visitorPhone: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } },
        { topics: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      ChatSession.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatSession.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/sessions — Create or update a chat session
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { sessionId, messages, visitorName, visitorPhone, visitorEmail, userAgent } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const userMessages = (messages || []).filter((m: any) => m.role === 'user');
    const botMessages = (messages || []).filter((m: any) => m.role === 'bot');

    // Extract topics from user messages
    const topicKeywords = [
      'thạc sĩ', 'tiến sĩ', 'học phí', 'tuyển sinh', 'xét tuyển',
      'tài chính', 'ngân hàng', 'quản trị', 'kế toán', 'kinh tế',
      'marketing', 'luật', 'kinh doanh quốc tế', 'toán kinh tế',
      'lịch thi', 'hồ sơ', 'điều kiện', 'bằng cấp', 'chứng chỉ',
      'bổ sung kiến thức', 'đào tạo ngắn hạn', 'học bổng',
    ];

    const allUserText = userMessages.map((m: any) => m.content).join(' ').toLowerCase();
    const topics = topicKeywords.filter(kw => allUserText.includes(kw));

    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          messages: messages || [],
          visitorName: visitorName || '',
          visitorPhone: visitorPhone || '',
          visitorEmail: visitorEmail || '',
          topics,
          status: 'completed',
          metadata: {
            userAgent: userAgent || '',
            startedAt: messages?.[0]?.timestamp || new Date(),
            endedAt: new Date(),
            totalMessages: (messages || []).length,
            totalUserMessages: userMessages.length,
            totalBotMessages: botMessages.length,
          },
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, sessionId: session.sessionId });
  } catch (error: any) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
