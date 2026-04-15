import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';
import ChatSession from '@/models/ChatSession';

export async function GET() {
  try {
    await connectDB();
    
    // Đếm Lead chưa đọc (để hiển thị badge Đỏ trên thanh sidebar/navbar)
    const unreadLeadsCount = await Lead.countDocuments({ isRead: false });

    // Đếm chat session cần xem lại (flagged)
    const flaggedSessionsCount = await ChatSession.countDocuments({ flagged: true });

    // Lấy 5 leads mới nhất chưa đọc làm thông báo dropdown
    const recentUnreadLeads = await Lead.find({ isRead: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const notifications = recentUnreadLeads.map((lead: any) => ({
      id: lead._id.toString(),
      type: 'lead',
      title: 'Khách hàng quan tâm mới',
      description: `${lead.fullName} vừa yêu cầu tư vấn. AI chấm: ${lead.aiAnalysis?.score || 0}/10 điểm.`,
      time: lead.createdAt.toISOString(),
      read: false,
      href: '/admin/khach-hang-tiem-nang',
      icon: 'UserPlus',
      color: 'emerald',
    }));

    // Để tạm badge cho /admin/khach-hang-tiem-nang và /admin/lich-su-chat
    const badges = {
      'Khách hàng tiềm năng': unreadLeadsCount,
      'Lịch sử trò chuyện': flaggedSessionsCount
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        badges,
        unreadCount: unreadLeadsCount
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi tải thông báo' },
      { status: 500 }
    );
  }
}
