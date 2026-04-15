import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Tuyển sinh UFM – Tư vấn Tuyển sinh SĐH' },
  seoTitle: { type: String, default: 'Chatbot Tuyển sinh Viện Đào tạo SĐH UFM' },
  seoDescription: { type: String, default: 'Trợ lý ảo thông minh tư vấn tuyển sinh đại học và sau đại học UFM.' },
  seoKeywords: { type: String, default: 'tuyển sinh, chatbot, ufm, thạc sĩ, tiến sĩ' },
  seoOgImage: { type: String, default: '/images/seo_cover.png' },
  seoOgImageBase64: { type: String, default: '' },
  seoAuthor: { type: String, default: 'Viện Đào tạo SĐH UFM' },
  seoCanonical: { type: String, default: 'https://daotaosdh.ufm.edu.vn' },
  seoThemeColor: { type: String, default: '#005496' }
}, { timestamps: true });

export default mongoose.models.Config || mongoose.model('Config', configSchema);
