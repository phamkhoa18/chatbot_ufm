import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

export async function POST(req: Request) {
  try {
    const { fullName, phone, email, chatHistory } = await req.json();

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Thiếu thông tin liên hệ' }, { status: 400 });
    }

    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length < 2) {
      return NextResponse.json({ success: true, message: 'Chưa có tương tác đủ để lưu.' }, { status: 200 });
    }

    // Chuẩn bị text lịch sử chat
    const historyText = chatHistory
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'Bot'}: ${m.content}`)
      .join('\n');

    // Gọi OpenRouter Gemini phân tích toàn bộ mẩu thoại
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
    let analysisResult = {
      isPotential: false,
      score: 0,
      summary: 'Không có API Key hoặc lỗi',
      interestedPrograms: [],
    };

    if (OPENROUTER_API_KEY) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Bạn là trợ lý phân tích dữ liệu khách hàng tuyển sinh cho Đại học UFM. 
Đọc đoạn chat sau và đánh giá xem người này có khả năng trở thành sinh viên (Lead tiềm năng) của trường không.
YÊU CẦU ĐẦU RA BẮT BUỘC (Chỉ trả về định dạng JSON, không giải thích):
{
  "isPotential": boolean (true nếu có biểu hiện quan tâm học thật sự, false nếu chỉ hỏi vớ vẩn),
  "score": number (Điểm tiềm năng từ 1 đến 10),
  "interestedPrograms": string[] (Danh sách các ngành học họ nhắc đến hoặc quan tâm),
  "summary": string (Tóm tắt ngắn gọn mục đích và nhu cầu của họ)
}`
              },
              {
                role: 'user',
                content: `ĐOẠN CHAT:\n${historyText}`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          try {
            const parsed = JSON.parse(content);
            analysisResult = { ...analysisResult, ...parsed };
          } catch (parseError) {}
        }
      } catch (err) {}
    }

    // Lấy config cấu hình (nếu cần dùng các thuộc tính khác sau này)
    await connectDB();
    
    // Hardcode ngưỡng điểm là 5 do đã gỡ khỏi phần cài đặt quản trị
    const THRESHOLD = 5;

    const isJunk = analysisResult.score < THRESHOLD || !analysisResult.isPotential;

    let leadId = null;
    let savedLead = null;

    if (!isJunk) {
      // Kiểm tra trùng lặp SĐT để Update thay vì Create (Tránh rác CRM)
      const existingLead = await Lead.findOne({ phone });

      if (existingLead) {
        // Merge danh sách ngành học (đảm bảo không trùng lặp)
        const updatedPrograms = Array.from(new Set([
          ...(existingLead.aiAnalysis?.interestedPrograms || []), 
          ...(analysisResult.interestedPrograms || [])
        ]));
        
        // Lấy điểm tiềm năng cao nhất qua các lần chat
        const newScore = Math.max(existingLead.aiAnalysis?.score || 0, analysisResult.score);

        // Update thông tin mới nhất và BẬT lại cờ isRead = false để báo Đỏ cho admin
        savedLead = await Lead.findOneAndUpdate(
          { phone },
          {
            $set: {
              fullName, // Cập nhật tên nếu họ nhập tên mới
              email: email || existingLead.email,
              isRead: false, // <-- Quan trọng: Thông báo lại cho Admin
              'aiAnalysis.score': newScore,
              'aiAnalysis.isPotential': true,
              'aiAnalysis.interestedPrograms': updatedPrograms,
              'aiAnalysis.summary': analysisResult.summary // Cập nhật tóm tắt mới nhất
            }
          },
          { new: true }
        );
      } else {
        // Nếu chưa tồn tại thì tạo mới CRM Lead
        savedLead = await Lead.create({
          fullName,
          phone,
          email: email || '',
          source: 'AI_Chatbot',
          status: 'New',
          aiAnalysis: analysisResult,
        });
      }
      leadId = savedLead._id;
    }

    // LUÔN LƯU Lịch sử trò chuyện (ChatSession)
    const ChatSession = await import('@/models/ChatSession').then(m => m.default);
    
    // Đếm số tin nhắn
    const totalUserMessages = chatHistory.filter((m: any) => m.role === 'user').length;
    const totalBotMessages = chatHistory.filter((m: any) => m.role === 'assistant' || m.role === 'bot').length;
    
    // Định dạng lại messages
    const formattedMessages = chatHistory
      .filter((m: any) => m.role !== 'system' && m.content != null && m.content.trim() !== '')
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'bot',
        content: String(m.content).trim()
      }));

    if (formattedMessages.length === 0) {
      return NextResponse.json({ success: true, message: 'Không có nội dung để lưu lịch sử.' }, { status: 200 });
    }

    await ChatSession.create({
       sessionId: crypto.randomUUID(),
       leadId: leadId,
       visitorName: fullName || '',
       visitorPhone: phone || '',
       visitorEmail: email || '',
       messages: formattedMessages,
       metadata: {
         userAgent: req.headers.get('user-agent') || '',
         startedAt: new Date(Date.now() - (chatHistory.length * 5000)), // Đoán tương đối
         endedAt: new Date(),
         totalMessages: formattedMessages.length,
         totalUserMessages,
         totalBotMessages
       },
       topics: analysisResult.interestedPrograms || [],
       status: 'completed',
       adminNotes: analysisResult.summary
    });

    if (isJunk) {
      return NextResponse.json({ success: true, message: `Phiên lưu lịch sử thành công. Lead ${analysisResult.score} điểm, KHÔNG lưu CRM.` }, { status: 200 });
    }

    return NextResponse.json({ success: true, lead: savedLead });
  } catch (error: any) {
    console.error('Error analyzing lead:', error);
    return NextResponse.json(
      { error: 'Gặp lỗi trong quá trình phân tích và lưu' },
      { status: 500 }
    );
  }
}
