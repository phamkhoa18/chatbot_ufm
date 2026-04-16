/**
 * Zalo Bot Platform API Utility
 * Docs: https://bot.zaloplatforms.com/docs/call-api/
 * 
 * API format: https://bot-api.zaloplatforms.com/bot{BOT_TOKEN}/{functionName}
 */

const ZALO_BOT_API = 'https://bot-api.zaloplatforms.com/bot';

// ========== GỬI TIN NHẮN TEXT ==========
export async function sendZaloBotMessage(
  botToken: string,
  chatId: string,
  text: string
) {
  const url = `${ZALO_BOT_API}${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[ZaloBot] sendMessage error:', data);
    throw new Error(data.description || 'Zalo Bot API error');
  }
  return data;
}

// ========== GỬI TYPING ACTION ==========
export async function sendZaloBotTyping(botToken: string, chatId: string) {
  const url = `${ZALO_BOT_API}${botToken}/sendChatAction`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });
  } catch { /* ignore typing errors */ }
}

// ========== SET WEBHOOK ==========
export async function setZaloBotWebhook(
  botToken: string,
  webhookUrl: string,
  secretToken?: string
) {
  const url = `${ZALO_BOT_API}${botToken}/setWebhook`;
  const body: any = { url: webhookUrl };
  if (secretToken) body.secret_token = secretToken;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[ZaloBot] setWebhook error:', data);
    throw new Error(data.description || 'Failed to set webhook');
  }
  return data;
}

// ========== DELETE WEBHOOK ==========
export async function deleteZaloBotWebhook(botToken: string) {
  const url = `${ZALO_BOT_API}${botToken}/deleteWebhook`;
  const res = await fetch(url, { method: 'POST' });
  return res.json();
}

// ========== GET BOT INFO ==========
export async function getZaloBotInfo(botToken: string) {
  const url = `${ZALO_BOT_API}${botToken}/getMe`;
  const res = await fetch(url);
  return res.json();
}

// ========== GET WEBHOOK INFO ==========
export async function getZaloBotWebhookInfo(botToken: string) {
  const url = `${ZALO_BOT_API}${botToken}/getWebhookInfo`;
  const res = await fetch(url);
  return res.json();
}
