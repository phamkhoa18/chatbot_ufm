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
  
  // Zalo giới hạn 2000 ký tự. Cắt nhỏ tin nhắn nếu quá dài (chuẩn 1900 cho an toàn)
  const MAX_LENGTH = 1900;
  const chunks = [];
  let currentStr = text;

  // Thuật toán cắt tin nhắn không làm đứt chữ
  while (currentStr.length > 0) {
    if (currentStr.length <= MAX_LENGTH) {
      chunks.push(currentStr);
      break;
    }
    
    let splitIndex = currentStr.lastIndexOf('\n', MAX_LENGTH); // Ưu tiên cắt theo đoạn văn
    if (splitIndex === -1) splitIndex = currentStr.lastIndexOf(' ', MAX_LENGTH); // Không có xuống dòng thì cắt theo chữ
    if (splitIndex === -1) splitIndex = MAX_LENGTH; // Chữ dính liền thì cắt cứng luôn
    
    chunks.push(currentStr.substring(0, splitIndex).trim());
    currentStr = currentStr.substring(splitIndex).trim();
  }

  let lastResponse;
  
  // Gửi tuần tự các đoạn tin nhắn
  for (const chunk of chunks) {
    if (!chunk) continue;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });

    lastResponse = await res.json();
    if (!lastResponse.ok) {
      console.error('[ZaloBot] sendMessage error:', lastResponse);
      throw new Error(lastResponse.description || 'Zalo Bot API error');
    }
    
    // Nghỉ 1 chút xíu giữa các tin để Zalo khỏi block spam
    await new Promise(r => setTimeout(r, 200)); 
  }

  return lastResponse;
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
  secretToken: string
) {
  const url = `${ZALO_BOT_API}${botToken}/setWebhook`;
  const body = { url: webhookUrl, secret_token: secretToken };

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
