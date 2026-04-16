import mongoose from 'mongoose';

const zaloConfigSchema = new mongoose.Schema({
  // Zalo Bot Token (duy nhất, không cần OAuth)
  botToken: { type: String, default: '' },

  // Webhook
  webhookUrl: { type: String, default: '' },
  webhookSecretToken: { type: String, default: '' },
  webhookActive: { type: Boolean, default: false },

  // Bot Behavior
  botEnabled: { type: Boolean, default: false },
  welcomeMessage: { type: String, default: 'Xin chào! Tôi là trợ lý ảo tư vấn tuyển sinh UFM. Bạn cần hỗ trợ gì ạ? 😊' },
  fallbackMessage: { type: String, default: 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Vui lòng thử lại hoặc gọi hotline.' },
  autoReplyEnabled: { type: Boolean, default: true },

  // Bot Info (fetched from getMe)
  botName: { type: String, default: '' },
  botId: { type: String, default: '' },

  // Stats
  totalMessagesSent: { type: Number, default: 0 },
  totalMessagesReceived: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.ZaloConfig || mongoose.model('ZaloConfig', zaloConfigSchema);
