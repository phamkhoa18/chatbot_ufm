'use client';

import { useState, useEffect } from 'react';
import { Settings, Bot, Server, CheckCircle2, XCircle, Loader2, Shield, Zap, Search, Globe, Save, Upload, Image as ImageIcon, Hash, Layers } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function SettingsPage() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [config, setConfig] = useState({
    siteName: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoOgImage: '',
    seoOgImageBase64: '',
    seoAuthor: '',
    seoCanonical: '',
    seoThemeColor: ''
  });
  const [ogPreviewUrl, setOgPreviewUrl] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config');
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
          if (json.data.seoOgImageBase64) {
             setOgPreviewUrl(`data:image/png;base64,${json.data.seoOgImageBase64}`);
          }
        }
      } catch (e) {
        showToast.error("Lỗi tải cấu hình");
      }
      setLoadingConfig(false);
    };

    const checkApi = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://chatbot-ufm-api.vincode.xyz';
        const res = await fetch(`${baseUrl}/health`);
        setApiStatus(res.ok ? 'ok' : 'error');
      } catch {
        setApiStatus('error');
      }
    };

    const checkDb = async () => {
      try {
        const res = await fetch('/api/admin/leads?limit=1');
        const json = await res.json();
        setDbStatus(json.success ? 'ok' : 'error');
      } catch {
        setDbStatus('error');
      }
    };

    fetchConfig();
    checkApi();
    checkDb();
  }, []);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setConfig(prev => ({ ...prev, seoOgImage: data.url, seoOgImageBase64: data.base64 }));
        setOgPreviewUrl(data.previewUrl);
        showToast.success('Đã biên dịch ảnh thành công!');
      } else {
        showToast.error(data.error || 'Lỗi tải ảnh');
      }
    } catch {
      showToast.error('Không thể kết nối máy chủ để tải ảnh');
    }
    setUploadingImage(false);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Đã lưu cấu hình thành công!');
      } else {
        showToast.error('Lưu cài đặt thất bại');
      }
    } catch (e) {
      showToast.error('Chưa thể kết nối lưu trữ');
    }
    setSavingConfig(false);
  };

  const statusIcon = (status: string) => {
    if (status === 'checking') return <Loader2 size={16} className="animate-spin text-slate-400" />;
    if (status === 'ok') return <CheckCircle2 size={16} className="text-emerald-500" />;
    return <XCircle size={16} className="text-rose-500" />;
  };

  const statusText = (status: string) => {
    if (status === 'checking') return 'Đang kiểm tra...';
    if (status === 'ok') return 'Hoạt động bình thường';
    return 'Không kết nối được';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#005496]" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">Quản lý cấu hình Chatbot, SEO, và kiểm tra trạng thái máy chủ.</p>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={savingConfig || loadingConfig}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#005496] hover:bg-[#004078] text-white text-[13px] font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu tất cả thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Chatbot Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20 relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#005496] via-blue-500 to-[#0284c7]"></div>
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-br from-slate-50 to-white gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005496]/10 to-[#0284c7]/10 flex items-center justify-center border border-[#005496]/20">
                  <Bot size={20} className="text-[#005496]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-slate-800">Định danh Chatbot</h2>
                  <p className="text-[12px] text-slate-500 font-medium">Thiết lập tên hiển thị của trợ lý ảo AI.</p>
                </div>
              </div>
            </div>
            {loadingConfig ? (
               <div className="p-12 flex justify-center"><Loader2 size={28} className="animate-spin text-[#005496]" /></div>
            ) : (
              <div className="p-6 space-y-6 bg-white relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none">
                  <Bot size={150} />
                </div>
                <div className="relative z-10">
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-2">
                    Tên Hệ Thống Chatbot
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Bot size={16} className="text-[#005496]/50" />
                    </div>
                    <input
                      type="text"
                      value={config.siteName}
                      onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50/50 hover:bg-white border border-slate-200 rounded-xl text-[14px] font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#005496]/10 focus:border-[#005496] shadow-sm transition-all"
                      placeholder="Nhập tên chatbot (VD: Tư Vấn Tuyển Sinh UFM)"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Status Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20 relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-br from-slate-50 to-white gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600">
                  <Server size={20} />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-slate-800">Trạng thái Dịch vụ mạng</h2>
                  <p className="text-[12px] text-slate-500 font-medium">Quản lý kết nối tới AI Engine và Database.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 bg-slate-50/30">
              <div className="flex items-center justify-between p-4 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] rounded-xl border border-blue-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-300 transition-all group/card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full mix-blend-multiply opacity-20 -mr-10 -mt-10 group-hover/card:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border border-blue-200 shadow-sm group-hover/card:scale-110 transition-transform">
                    <Zap size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">FastAPI Backend</p>
                    <p className="text-[11px] text-slate-500 font-medium font-mono mt-0.5 px-2 py-0.5 bg-slate-100 rounded inline-block border border-slate-200/60">{process.env.NEXT_PUBLIC_FASTAPI_URL || 'Tự động trích xuất URI'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 relative z-10">
                  <div className={`p-1.5 rounded-lg border ${apiStatus === 'ok' ? 'bg-emerald-50 border-emerald-200' : apiStatus === 'error' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    {statusIcon(apiStatus)}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${apiStatus === 'ok' ? 'text-emerald-600' : apiStatus === 'error' ? 'text-rose-500' : 'text-slate-400'}`}>
                    {statusText(apiStatus)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] rounded-xl border border-emerald-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-300 transition-all group/card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full mix-blend-multiply opacity-30 -mr-10 -mt-10 group-hover/card:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center border border-emerald-200 shadow-sm group-hover/card:scale-110 transition-transform">
                    <Shield size={22} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">MongoDB Cluster</p>
                    <p className="text-[11px] text-slate-500 font-medium font-mono mt-0.5 px-2 py-0.5 bg-slate-100 rounded inline-block border border-slate-200/60">Primary Database</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 relative z-10">
                  <div className={`p-1.5 rounded-lg border ${dbStatus === 'ok' ? 'bg-emerald-50 border-emerald-200' : dbStatus === 'error' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    {statusIcon(dbStatus)}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${dbStatus === 'ok' ? 'text-emerald-600' : dbStatus === 'error' ? 'text-rose-500' : 'text-slate-400'}`}>
                    {statusText(dbStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* SEO Metadata Config */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xl shadow-slate-200/20 relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-br from-slate-50 to-white gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-600">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="text-[16px] font-extrabold text-slate-800">Cấu hình SEO & Nền tảng</h2>
                  <p className="text-[12px] text-slate-500 font-medium">Tối ưu hóa công cụ tìm kiếm và hiển thị MXH.</p>
                </div>
              </div>
            </div>
            {loadingConfig ? (
               <div className="p-8 flex justify-center"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
            ) : (
              <div className="p-6 space-y-5">
                <div>
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Thẻ Meta Title (Tiêu đề SEO)</label>
                  <input
                    type="text"
                    value={config.seoTitle}
                    onChange={(e) => setConfig({ ...config, seoTitle: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">Dấu hiệu nhận diện trên tìm kiếm Google và các tab trình duyệt.</p>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Thẻ Meta Description</label>
                  <textarea
                    value={config.seoDescription}
                    onChange={(e) => setConfig({ ...config, seoDescription: e.target.value })}
                    className="w-full h-24 p-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all resize-none"
                    placeholder="Mô tả công cụ tìm kiếm của trang frontend chatbot..."
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Từ khóa (Keywords)</label>
                  <input
                    type="text"
                    value={config.seoKeywords}
                    onChange={(e) => setConfig({ ...config, seoKeywords: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
                    placeholder="chatbot, ufm, tuyển sinh sau đại học, phân tích trực tiếp..."
                  />
                  <p className="text-[11px] text-slate-400 mt-2">Ngăn cách mỗi từ khóa bằng dấu phẩy.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Đường dẫn chuẩn (Canonical)</label>
                    <input
                      type="url"
                      value={config.seoCanonical}
                      onChange={(e) => setConfig({ ...config, seoCanonical: e.target.value })}
                      className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
                      placeholder="https://daotaosdh.ufm.edu.vn"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Tên Tác giả (Author)</label>
                    <input
                      type="text"
                      value={config.seoAuthor}
                      onChange={(e) => setConfig({ ...config, seoAuthor: e.target.value })}
                      className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
                      placeholder="Viện Đào tạo SĐH UFM"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Ảnh Cover chia sẻ MXH (OG Image)</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.seoOgImage}
                          onChange={(e) => setConfig({ ...config, seoOgImage: e.target.value })}
                          className="flex-1 h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all"
                          placeholder="VD: /uploads/seo_cover.png"
                        />
                        <label className="flex items-center justify-center w-11 h-11 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl border border-indigo-200 cursor-pointer transition-colors shadow-sm flex-shrink-0">
                          {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={uploadingImage} />
                        </label>
                      </div>
                      {config.seoOgImage && (
                        <div className="w-full h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center overflow-hidden">
                          <img src={config.seoOgImage} alt="OG Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Màu chủ đạo (Theme Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.seoThemeColor || '#005496'}
                        onChange={(e) => setConfig({ ...config, seoThemeColor: e.target.value })}
                        className="w-11 h-11 p-1 bg-white border border-slate-300 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.seoThemeColor}
                        onChange={(e) => setConfig({ ...config, seoThemeColor: e.target.value })}
                        className="flex-1 h-11 px-4 bg-white border border-slate-300 rounded-xl text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 shadow-sm transition-all uppercase"
                        placeholder="#005496"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          

        </div>
      </div>
    </div>
  );
}
