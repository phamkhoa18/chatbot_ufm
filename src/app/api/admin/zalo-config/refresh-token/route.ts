import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ZaloConfig from '@/models/ZaloConfig';
import { setZaloBotWebhook } from '@/lib/zalo';

// POST — Đăng ký webhook với Zalo Bot API
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const config = await ZaloConfig.findOne();

    if (!config || !config.botToken) {
      return NextResponse.json({ success: false, error: 'Chưa có Bot Token. Vui lòng lưu Bot Token trước.' }, { status: 400 });
    }

    const body = await req.json();
    const webhookUrl = body.webhookUrl || config.webhookUrl;
    const secretToken = body.secretToken || config.webhookSecretToken;

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: 'Chưa có Webhook URL' }, { status: 400 });
    }

    if (!secretToken) {
      return NextResponse.json({ success: false, error: 'Chưa có Webhook Secret Token (Zalo bắt buộc)' }, { status: 400 });
    }

    const result = await setZaloBotWebhook(config.botToken, webhookUrl, secretToken);

    if (result.ok) {
      config.webhookUrl = webhookUrl;
      config.webhookSecretToken = secretToken;
      config.webhookActive = true;
      await config.save();
    }

    return NextResponse.json({
      success: result.ok,
      message: result.ok ? 'Webhook đã được đăng ký thành công với Zalo Bot!' : 'Đăng ký webhook thất bại',
      data: result,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
