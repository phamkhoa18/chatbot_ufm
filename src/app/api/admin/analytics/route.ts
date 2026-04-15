import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Lead from '@/models/Lead';

// GET /api/admin/analytics — Aggregated analytics for dashboard & analytics page
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // --- Parallel queries ---
    const [
      totalSessions,
      totalLeads,
      recentSessions,
      leadsByStatus,
      feedbackStats,
      topTopics,
      dailyChats,
    ] = await Promise.all([
      // 1. Total sessions
      ChatSession.countDocuments(),

      // 2. Total leads
      Lead.countDocuments(),

      // 3. Recent sessions count (within range)
      ChatSession.countDocuments({ createdAt: { $gte: startDate } }),

      // 4. Leads grouped by status
      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // 5. Feedback stats
      ChatSession.aggregate([
        { $unwind: '$feedback' },
        {
          $group: {
            _id: '$feedback.rating',
            count: { $sum: 1 },
          },
        },
      ]),

      // 6. Top topics (from sessions within range)
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $unwind: '$topics' },
        { $group: { _id: '$topics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // 7. Daily chat count (for chart)
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' },
            },
            count: { $sum: 1 },
            totalMessages: { $sum: '$metadata.totalMessages' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Process lead stats
    const leadStats: Record<string, number> = {};
    leadsByStatus.forEach((s: any) => {
      leadStats[s._id] = s.count;
    });

    // Process feedback
    let thumbsUp = 0;
    let thumbsDown = 0;
    feedbackStats.forEach((f: any) => {
      if (f._id === 'up') thumbsUp = f.count;
      if (f._id === 'down') thumbsDown = f.count;
    });

    const totalFeedback = thumbsUp + thumbsDown;
    const satisfactionRate = totalFeedback > 0 ? Math.round((thumbsUp / totalFeedback) * 100) : 0;
    const conversionRate = totalSessions > 0 ? Math.round((totalLeads / totalSessions) * 100) : 0;

    // Fill missing days for chart
    const dailyData: { date: string; count: number; totalMessages: number }[] = [];
    const dailyMap = new Map(dailyChats.map((d: any) => [d._id, d]));
    
    // Create base date exactly matching start of today in local time
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Construct YYYY-MM-DD safely in local time
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      
      const existing = dailyMap.get(key);
      dailyData.push({
        date: key,
        count: existing?.count || 0,
        totalMessages: existing?.totalMessages || 0,
      });
    }

    // Average messages per session
    const avgMsgResult = await ChatSession.aggregate([
      { $match: { 'metadata.totalMessages': { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$metadata.totalMessages' },
        },
      },
    ]);
    const avgMessagesPerSession = avgMsgResult[0]?.avg
      ? Math.round(avgMsgResult[0].avg * 10) / 10
      : 0;

    // Average AI lead score
    const avgScoreResult = await Lead.aggregate([
      { $match: { 'aiAnalysis.score': { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$aiAnalysis.score' } } },
    ]);
    const avgLeadScore = avgScoreResult[0]?.avg
      ? Math.round(avgScoreResult[0].avg * 10) / 10
      : 0;

    // Top interested programs from leads
    const topPrograms = await Lead.aggregate([
      { $unwind: '$aiAnalysis.interestedPrograms' },
      { $group: { _id: '$aiAnalysis.interestedPrograms', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          totalLeads,
          recentSessions,
          conversionRate,
          satisfactionRate,
          avgMessagesPerSession,
          avgLeadScore,
        },
        leads: {
          new: leadStats['New'] || 0,
          contacted: leadStats['Contacted'] || 0,
          enrolled: leadStats['Enrolled'] || 0,
          junk: leadStats['Junk'] || 0,
        },
        feedback: { thumbsUp, thumbsDown, total: totalFeedback, satisfactionRate },
        topTopics: topTopics.map((t: any) => ({ topic: t._id, count: t.count })),
        topPrograms: topPrograms.map((p: any) => ({ program: p._id, count: p.count })),
        dailyChats: dailyData,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
