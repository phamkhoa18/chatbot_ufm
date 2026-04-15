import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';

// POST /api/feedback — Save thumbs up/down from chat page
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { sessionId, messageIndex, rating } = await req.json();

    if (!sessionId || messageIndex === undefined || !['up', 'down'].includes(rating)) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 });
    }

    await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          feedback: {
            messageIndex,
            rating,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
