'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, Key, Link2, Webhook, Bot, Shield, Save, Loader2,
  CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Copy, ExternalLink,
  Send, Zap, Radio, AlertTriangle, Clock, Lock, Info,
  MessageSquareText, Play, Plug
} from 'lucide-react';
import { showToast } from '@/lib/toast';

interface ZaloConfig {
  _id?: string;
  botToken: string;
  webhookUrl: string;
  webhookSecretToken: string;
  webhookActive: boolean;
  botEnabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  autoReplyEnabled: boolean;
  botName: string;
  botId: string;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  _hasBotToken: boolean;
  _hasWebhookSecret: boolean;
}

const DEFAULT_CONFIG: ZaloConfig = {
  botToken: '', webhookUrl: '', webhookSecretToken: '',
  webhookActive: false, botEnabled: false,
  welcomeMessage: 'Xin chào! Tôi là trợ lý ảo tư vấn tuyển sinh UFM. Bạn cần hỗ trợ gì ạ? 😊',
  fallbackMessage: 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Vui lòng thử lại hoặc gọi hotline.',
  autoReplyEnabled: true, botName: '', botId: '',
  totalMessagesSent: 0, totalMessagesReceived: 0,
  _hasBotToken: false, _hasWebhookSecret: false,
};

export default function ZaloBotPage() {
  const [config, setConfig] = useState<ZaloConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registeringWebhook, setRegisteringWebhook] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'token' | 'webhook' | 'bot'>('token');

  // Test chat state
  const [testMessage, setTestMessage] = useState('');
  const [testChat, setTestChat] = useState<{ role: string; text: string }[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/zalo-config');
      const json = await res.json();
      if (json.success && json.data) {
        setConfig({ ...DEFAULT_CONFIG, ...json.data });
      }
    } catch {
      showToast.error('Không thể tải cấu hình Zalo');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/zalo-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Đã lưu cấu hình Zalo Bot thành công!');
        fetchConfig();
      } else {
        showToast.error(json.error || 'Lưu thất bại');
      }
    } catch {
      showToast.error('Lỗi kết nối server');
    }
    setSaving(false);
  };

  const handleRegisterWebhook = async () => {
    setRegisteringWebhook(true);
    try {
      const webhookUrl = config.webhookUrl || `${window.location.origin}/api/zalo/webhook`;
      const res = await fetch('/api/admin/zalo-config/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Webhook đã được đăng ký với Zalo Bot!');
        fetchConfig();
      } else {
        showToast.error(json.error || 'Đăng ký webhook thất bại');
      }
    } catch {
      showToast.error('Không thể kết nối server');
    }
    setRegisteringWebhook(false);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const webhookUrl = config.webhookUrl || `${window.location.origin}/api/zalo/webhook`;
      const res = await fetch(webhookUrl);
      if (res.ok) {
        showToast.success('Webhook endpoint phản hồi OK!');
      } else {
        showToast.error(`Webhook trả về status ${res.status}`);
      }
    } catch {
      showToast.error('Không thể kết nối webhook');
    }
    setTestingWebhook(false);
  };

  // Test chat — giả lập gửi tin nhắn qua webhook flow
  const handleTestChat = async () => {
    if (!testMessage.trim()) return;
    const msg = testMessage.trim();
    setTestMessage('');
    setTestChat(prev => [...prev, { role: 'user', text: msg }]);
    setTestLoading(true);

    try {
      // Gọi trực tiếp FastAPI backend (giống webhook flow)
      const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz';
      const res = await fetch(`${fastApiUrl}/api/v1/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          query: msg,
          chat_history: testChat.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          session_id: 'zalobot_test_admin',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.response || config.fallbackMessage;
        setTestChat(prev => [...prev, { role: 'bot', text: reply }]);
      } else {
        setTestChat(prev => [...prev, { role: 'bot', text: `⚠️ FastAPI trả về lỗi ${res.status}` }]);
      }
    } catch (e) {
      setTestChat(prev => [...prev, { role: 'bot', text: '❌ Không thể kết nối tới FastAPI backend' }]);
    }
    setTestLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast.success('Đã sao chép!');
  };

  const tabs = [
    { id: 'token' as const, label: 'Bot Token', icon: Key, color: '#005496' },
    { id: 'webhook' as const, label: 'Webhook', icon: Webhook, color: '#0ea5e9' },
    { id: 'bot' as const, label: 'Cấu hình & Test', icon: Bot, color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#005496]" />
          <p className="text-sm text-slate-500 font-medium">Đang tải cấu hình Zalo Bot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            Zalo Bot Platform
          </h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            Kết nối chatbot AI UFM với Zalo Bot để tự động trả lời tin nhắn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfig(prev => ({ ...prev, botEnabled: !prev.botEnabled }))}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border shadow-sm ${
              config.botEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${config.botEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
            {config.botEnabled ? 'Bot đang BẬT' : 'Bot đang TẮT'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#005496] hover:bg-[#004078] text-white text-[13px] font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu cấu hình
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Tin nhắn đã nhận</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquareText size={16} className="text-blue-600" />
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-slate-900 tracking-tight">{config.totalMessagesReceived}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Tin nhắn đã gửi</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-slate-900 tracking-tight">{config.totalMessagesSent}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-violet-300 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Bot Info</span>
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot size={16} className="text-violet-600" />
            </div>
          </div>
          <div className="text-[14px] font-extrabold text-slate-800 tracking-tight">
            {config.botName || (config._hasBotToken ? 'Đã kết nối' : 'Chưa cấu hình')}
          </div>
          {config.webhookActive && <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> Webhook active</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300 flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/40'
            }`}
          >
            <tab.icon size={16} style={{ color: activeTab === tab.id ? tab.color : undefined }} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-300">

        {/* ======== TAB 1: BOT TOKEN ======== */}
        {activeTab === 'token' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20">
            <div className="h-1.5 bg-gradient-to-r from-[#005496] via-blue-500 to-[#0284c7]"></div>
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005496]/10 to-blue-500/10 flex items-center justify-center border border-[#005496]/20">
                  <Key size={20} className="text-[#005496]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-slate-800">Bot Token</h2>
                  <p className="text-[12px] text-slate-500 font-medium">Token duy nhất để xác thực Bot với Zalo Platform.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                  Bot Token <span className="text-rose-500">*</span>
                  {config._hasBotToken && <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-700 rounded-md uppercase">Đã cấu hình</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={14} className="text-slate-400" />
                  </div>
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    value={config.botToken}
                    onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                    className="w-full h-12 pl-10 pr-24 bg-white border border-slate-300 rounded-xl text-[13px] font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005496]/50 focus:border-[#005496] shadow-sm transition-all"
                    placeholder="Paste Bot Token từ Zalo Bot Creator"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                    <button onClick={() => setShowBotToken(!showBotToken)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showBotToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => copyToClipboard(config.botToken)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-[12px] text-blue-800 font-medium leading-relaxed space-y-1">
                    <p className="font-bold text-[13px]">Cách lấy Bot Token:</p>
                    <p>1. Mở Zalo → Tìm <strong>Bot Creator</strong> → Tạo Bot mới</p>
                    <p>2. Hoặc truy cập: <a href="https://zalo.me/s/botcreator/" target="_blank" rel="noopener" className="underline font-bold">zalo.me/s/botcreator</a></p>
                    <p>3. Sau khi tạo xong, copy <strong>Bot Token</strong> → Paste vào ô trên</p>
                    <p>4. Nhấn <strong>"Lưu cấu hình"</strong></p>
                    <p className="text-emerald-700 font-bold flex items-center gap-1 mt-2"><CheckCircle2 size={12} /> Token không hết hạn — chỉ cần set 1 lần!</p>
                  </div>
                </div>
              </div>

              {/* Bot info display */}
              {config.botName && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Bot size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">{config.botName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">ID: {config.botId}</p>
                  </div>
                  <CheckCircle2 size={20} className="text-emerald-500 ml-auto" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======== TAB 2: WEBHOOK ======== */}
        {activeTab === 'webhook' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20">
            <div className="h-1.5 bg-gradient-to-r from-[#0ea5e9] via-cyan-500 to-teal-500"></div>
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Webhook size={20} className="text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-slate-800">Cấu hình Webhook</h2>
                  <p className="text-[12px] text-slate-500 font-medium">URL nhận tin nhắn từ Zalo Bot Platform.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Webhook URL */}
              <div>
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Link2 size={14} className="text-slate-400" />
                    </div>
                    <input
                      type="url"
                      value={config.webhookUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/zalo/webhook`}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                      className="w-full h-12 pl-10 pr-4 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-[13px] font-mono font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 shadow-sm transition-all"
                      placeholder="https://your-domain.com/api/zalo/webhook"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(config.webhookUrl || `${window.location.origin}/api/zalo/webhook`)}
                    className="h-12 w-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 transition-colors shrink-0"
                    title="Sao chép"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Webhook Secret Token */}
              <div>
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Secret Token (tùy chọn)
                </label>
                <input
                  type="text"
                  value={config.webhookSecretToken}
                  onChange={(e) => setConfig({ ...config, webhookSecretToken: e.target.value })}
                  className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 shadow-sm transition-all"
                  placeholder="Token bảo mật trong header X-Bot-Api-Secret-Token"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">Zalo gửi kèm header <code className="bg-slate-100 px-1 rounded text-[10px]">X-Bot-Api-Secret-Token</code> để xác thực request.</p>
              </div>

              {/* Register webhook button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRegisterWebhook}
                  disabled={registeringWebhook || !config._hasBotToken}
                  className="flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {registeringWebhook ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
                  Đăng ký Webhook với Zalo
                </button>
                <button
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {testingWebhook ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
                  Test Ping
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.webhookActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-[13px] font-bold text-slate-700">Trạng thái Webhook</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {config.webhookActive ? 'Đang hoạt động' : 'Chưa đăng ký — Nhấn "Đăng ký Webhook" ở trên'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                  config.webhookActive
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {config.webhookActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>

              {/* Hint */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-[12px] text-amber-800 font-medium leading-relaxed">
                    <p className="font-bold">Localhost?</p>
                    <p>Nếu chạy dev, cần dùng <code className="px-1.5 py-0.5 bg-amber-100 rounded font-bold text-[11px]">ngrok http 3000</code> rồi sét URL HTTPS vào ô trên.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== TAB 3: BOT CONFIG + TEST CHAT ======== */}
        {activeTab === 'bot' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Config */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center border border-violet-500/20">
                    <Bot size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-slate-800">Hành vi Bot</h2>
                    <p className="text-[12px] text-slate-500 font-medium">Tùy chỉnh phản hồi.</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <ToggleSwitch
                  label="Kích hoạt Bot"
                  description="Bật/tắt toàn bộ chatbot"
                  enabled={config.botEnabled}
                  onChange={(v) => setConfig({ ...config, botEnabled: v })}
                  color="emerald"
                />
                <ToggleSwitch
                  label="Tự động trả lời AI"
                  description="Forward tin nhắn sang AI để trả lời"
                  enabled={config.autoReplyEnabled}
                  onChange={(v) => setConfig({ ...config, autoReplyEnabled: v })}
                  color="blue"
                />

                <div>
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Tin nhắn dự phòng</label>
                  <textarea
                    value={config.fallbackMessage}
                    onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })}
                    className="w-full h-20 p-3 bg-white border border-slate-300 rounded-xl text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 shadow-sm transition-all resize-none"
                    placeholder="Tin khi AI không xử lý được..."
                  />
                </div>

                <div className="bg-violet-50/50 border border-violet-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-violet-500" />
                    <span className="text-[11px] text-violet-800 font-bold">AI Backend:</span>
                    <code className="text-[10px] font-bold text-violet-700 bg-violet-100/80 px-2 py-0.5 rounded-md">
                      {process.env.NEXT_PUBLIC_FASTAPI_URL || 'chatbot-ufm-api.vincode.xyz'}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Test Chat */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20 flex flex-col">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20">
                    <Play size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-slate-800">Test Chat Bot</h2>
                    <p className="text-[12px] text-slate-500 font-medium">Giả lập flow Zalo → AI → Reply.</p>
                  </div>
                </div>
              </div>
              {/* Chat area */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px] min-h-[300px] bg-slate-50/30">
                {testChat.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <MessageCircle size={20} className="text-slate-300" />
                    </div>
                    <p className="text-[13px] text-slate-400 font-medium text-center">Gõ tin nhắn bên dưới để test<br/>AI chatbot response</p>
                  </div>
                )}
                {testChat.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#005496] text-white rounded-br-md'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {testLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Input */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                    className="flex-1 h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="Gõ tin nhắn thử..."
                    disabled={testLoading}
                  />
                  <button
                    onClick={handleTestChat}
                    disabled={testLoading || !testMessage.trim()}
                    className="h-11 w-11 flex items-center justify-center bg-[#005496] hover:bg-[#004078] text-white rounded-xl transition-all disabled:opacity-50 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== SUB COMPONENTS ==========

function ToggleSwitch({ label, description, enabled, onChange, color }: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void; color: string;
}) {
  const colors: Record<string, string> = { emerald: 'bg-emerald-500', blue: 'bg-blue-500', violet: 'bg-violet-500' };
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
      <div>
        <p className="text-[14px] font-bold text-slate-700">{label}</p>
        <p className="text-[12px] text-slate-500 font-medium mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${
          enabled ? colors[color] || 'bg-blue-500' : 'bg-slate-300'
        }`}
      >
        <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}
