import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ZaloConfig from '@/models/ZaloConfig';
import { sendZaloBotMessage, sendZaloBotTyping } from '@/lib/zalo';

/**
 * Zalo Bot Platform Webhook
 * Nhận events từ Zalo khi user nhắn tin cho bot.
 * 
 * Webhook payload format:
 * {
 *   "ok": true,
 *   "result": {
 *     "event_name": "message.text.received",
 *     "message": {
 *       "from": { "id": "xxx", "display_name": "Ted", "is_bot": false },
 *       "chat": { "id": "xxx", "chat_type": "PRIVATE" },
 *       "text": "Xin chào",
 *       "message_id": "xxx",
 *       "date": 1750316131602
 *     }
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const config = await ZaloConfig.findOne();

    if (!config || !config.botEnabled || !config.botToken) {
      return NextResponse.json({ message: 'Bot not active' }, { status: 200 });
    }

    // Verify secret token from header
    if (config.webhookSecretToken) {
      const headerToken = req.headers.get('x-bot-api-secret-token');
      if (headerToken !== config.webhookSecretToken) {
        console.warn('[ZaloBot Webhook] Invalid secret token');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { ok, result } = body;

    if (!ok || !result) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 200 });
    }

    const { event_name, message } = result;
    console.log('[ZaloBot Webhook] Event:', event_name, '| From:', message?.from?.display_name);

    // Xử lý tin nhắn text
    if (event_name === 'message.text.received' && message?.text) {
      config.totalMessagesReceived += 1;

      if (!config.autoReplyEnabled) {
        await config.save();
        return NextResponse.json({ message: 'Success' });
      }

      const chatId = message.chat.id;

      // Gửi typing indicator
      await sendZaloBotTyping(config.botToken, chatId);

      // Forward câu hỏi tới FastAPI AI backend
      let aiReply = config.fallbackMessage;
      try {
        const fastApiUrl = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz';
        const aiRes = await fetch(`${fastApiUrl}/api/v1/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            query: message.text,
            chat_history: [],
            session_id: `zalobot_${message.from.id}`,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.response) {
            aiReply = aiData.response;
          }
        }
      } catch (e) {
        console.error('[ZaloBot] AI backend error:', e);
      }

      // Gửi phản hồi về cho user qua Zalo Bot API
      try {
        await sendZaloBotMessage(config.botToken, chatId, aiReply);
        config.totalMessagesSent += 1;
      } catch (e) {
        console.error('[ZaloBot] sendMessage failed:', e);
      }

      await config.save();
      return NextResponse.json({ message: 'Success' });
    }

    // Sự kiện hình ảnh
    if (event_name === 'message.image.received') {
      config.totalMessagesReceived += 1;
      
      if (config.autoReplyEnabled && message?.chat?.id) {
        try {
          await sendZaloBotMessage(
            config.botToken,
            message.chat.id,
            'Cảm ơn bạn đã gửi hình ảnh! Hiện tại tôi chỉ hỗ trợ xử lý tin nhắn văn bản. Vui lòng gõ câu hỏi bạn muốn hỏi nhé! 😊'
          );
          config.totalMessagesSent += 1;
        } catch { /* ignore */ }
      }

      await config.save();
      return NextResponse.json({ message: 'Success' });
    }

    // Các event khác
    return NextResponse.json({ message: 'Success' });
  } catch (e: any) {
    console.error('[ZaloBot Webhook] Error:', e);
    return NextResponse.json({ message: 'Error', error: e.message }, { status: 200 });
  }
}

// GET — Health check
export async function GET() {
  return NextResponse.json({ status: 'Zalo Bot Webhook endpoint active' });
}
