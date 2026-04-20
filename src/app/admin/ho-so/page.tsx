'use client';

import { useState, useEffect } from 'react';
import { User, Key, Save, Loader2, Lock, Mail, UserCircle } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ fullName: '', email: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  const [pwData, setPwData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loadingPw, setLoadingPw] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/admin/accounts/profile');
      const json = await res.json();
      if (json.success) {
        setProfile({ fullName: json.data.fullName, email: json.data.email });
      }
    } catch {}
    setLoadingInit(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/admin/accounts/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Cập nhật hồ sơ thành công!');
        fetchProfile();
      } else {
        showToast.error(data.error || 'Lỗi cập nhật hồ sơ');
      }
    } catch {
      showToast.error('Lỗi máy chủ');
    }
    setLoadingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      showToast.error('Mật khẩu nhập lại không khớp');
      return;
    }
    
    setLoadingPw(true);
    try {
      const res = await fetch('/api/admin/accounts/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: pwData.oldPassword, newPassword: pwData.newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Đổi mật khẩu thành công!');
        setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast.error(data.error || 'Lỗi đổi mật khẩu');
      }
    } catch {
      showToast.error('Lỗi máy chủ');
    }
    setLoadingPw(false);
  };

  if (loadingInit) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-[#005496]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-[#005496]" />
          Hồ Sơ Cá Nhân
        </h1>
        <p className="text-[14px] text-slate-500 font-medium mt-1">Cập nhật thông tin cá nhân và thay đổi mật khẩu truy cập hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Update Profile Form */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <User size={18} className="text-[#005496]" />
              Thông tin chung
            </h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Họ Tên Cán Bộ</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})} className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-[14px] font-semibold focus:ring-2 focus:ring-[#005496]/50 focus:border-[#005496]" placeholder="Nhập họ tên" />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Địa chỉ Email (Tài khoản)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-[14px] font-semibold focus:ring-2 focus:ring-[#005496]/50 focus:border-[#005496]" placeholder="Nhập địa chỉ email" />
              </div>
            </div>

            <button type="submit" disabled={loadingProfile} className="w-full h-11 bg-[#005496] hover:bg-[#004377] text-white text-[13px] font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6">
              {loadingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Cập nhật Hồ sơ
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <Key size={18} className="text-amber-500" />
              Đổi mật khẩu Của bạn
            </h2>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Mật khẩu Cũ</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={pwData.oldPassword} onChange={e => setPwData({...pwData, oldPassword: e.target.value})} className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-[14px] focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Mật khẩu Mới</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={pwData.newPassword} onChange={e => setPwData({...pwData, newPassword: e.target.value})} className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-[14px] focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Nhập lại Mật khẩu Mới</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required value={pwData.confirmPassword} onChange={e => setPwData({...pwData, confirmPassword: e.target.value})} className="w-full h-11 pl-10 pr-4 bg-white border border-slate-300 rounded-xl text-[14px] focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loadingPw} className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6">
              {loadingPw ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu thay đổi Mật khẩu
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
