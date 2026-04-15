'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, ArrowRight, Loader2, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    secretKey: '' // Required to register as an Admin
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password || !formData.secretKey) {
      setError('Vui lòng điền đủ thông tin bắt buộc');
      return;
    }

    if (formData.secretKey !== 'UFM2024') {
      setError('Mã xác thực Admin không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast.success('Đăng ký tài khoản Quản trị thành công!');
        router.push('/login');
      } else {
        setError(data.error || 'Lỗi đăng ký');
        showToast.error(data.error || 'Lỗi đăng ký');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ');
      showToast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex py-10 items-center justify-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#005496]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[480px] p-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#005496]/10 mb-5 relative group cursor-default p-2 border border-slate-100">
            <Image src="/logo_ufm.png" alt="Logo UFM" width={68} height={68} priority className="object-contain relative z-10 duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#005496]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Cấp quyền Quản trị (Admin)</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1.5 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-[#005496]" />
            Hệ thống Quản trị AI Chatbot
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 p-8 border border-slate-100/80 backdrop-blur-xl">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[13px] font-bold text-center animate-in shake">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider pl-1">Họ và tên</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005496] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005496]/30 focus:border-[#005496] focus:bg-white transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider pl-1">Tên đăng nhập</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005496] transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full h-12 pl-11 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005496]/30 focus:border-[#005496] focus:bg-white transition-all"
                    placeholder="Tài khoản"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider pl-1">Mật khẩu</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#005496] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-12 pl-11 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005496]/30 focus:border-[#005496] focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider pl-1">Mã bảo mật cấp quyền</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">
                  <KeyRound size={18} />
                </div>
                <input
                  type="text"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 focus:bg-white transition-all"
                  placeholder="Mã kích hoạt cấp từ trường (vd: UFM2024)"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium pl-1 mt-1">
                Lưu ý: Chỉ cán bộ nhà trường có mã nội bộ mới được phép tạo tài khoản quản trị viện AI.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-[#005496] hover:bg-[#004078] text-white rounded-xl font-bold text-[14px] shadow-md shadow-[#005496]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 group overflow-hidden relative"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  Đăng ký Quản trị viên <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="pt-4 mt-4 border-t border-slate-100 text-center">
              <Link href="/login" className="text-[13px] font-bold text-slate-500 hover:text-[#005496] transition-colors">
                Đã có tài khoản? Đăng nhập ngay
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] font-medium text-slate-400 mt-8">
          Hệ thống Độc quyền dành cho Cán bộ SĐH UFM.
        </p>
      </div>
    </div>
  );
}
