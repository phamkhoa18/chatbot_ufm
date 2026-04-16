import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ZaloConfig from '@/models/ZaloConfig';
import { getZaloBotInfo } from '@/lib/zalo';

// GET — Lấy cấu hình Zalo Bot
export async function GET() {
  try {
    await connectDB();
    let config = await ZaloConfig.findOne();
    if (!config) {
      config = await ZaloConfig.create({});
    }

    const masked = {
      ...config.toObject(),
      botToken: config.botToken ? '••••••' + config.botToken.slice(-8) : '',
      webhookSecretToken: config.webhookSecretToken ? '••••••' + config.webhookSecretToken.slice(-4) : '',
      _hasBotToken: !!config.botToken,
      _hasWebhookSecret: !!config.webhookSecretToken,
    };

    return NextResponse.json({ success: true, data: masked });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// PUT — Cập nhật cấu hình
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    let config = await ZaloConfig.findOne();
    if (!config) {
      config = await ZaloConfig.create({});
    }

    const updatableFields = [
      'webhookUrl', 'botEnabled', 'welcomeMessage',
      'fallbackMessage', 'autoReplyEnabled', 'webhookActive',
    ];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        (config as any)[field] = body[field];
      }
    }

    // Bot Token — chỉ update khi không phải masked
    if (body.botToken && !body.botToken.startsWith('••••••')) {
      config.botToken = body.botToken;

      // Fetch bot info khi set token mới
      try {
        const info = await getZaloBotInfo(body.botToken);
        if (info.ok && info.result) {
          config.botName = info.result.display_name || info.result.username || '';
          config.botId = info.result.id || '';
        }
      } catch { /* ignore */ }
    }

    // Webhook secret token
    if (body.webhookSecretToken && !body.webhookSecretToken.startsWith('••••••')) {
      config.webhookSecretToken = body.webhookSecretToken;
    }

    await config.save();
    return NextResponse.json({ success: true, message: 'Đã cập nhật cấu hình Zalo Bot thành công' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
