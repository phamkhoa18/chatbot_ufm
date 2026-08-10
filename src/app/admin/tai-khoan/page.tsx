'use client';

import { useState, useEffect } from 'react';
import { Users, Key, Plus, ShieldAlert, Loader2, Save, Trash2, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/lib/toast';

export default function AccountManagementPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Đổi mật khẩu cá nhân
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Form Tạo tài khoản mới
  const [newAcc, setNewAcc] = useState({ fullName: '', email: '', password: '', role: 'admin' });
  const [loadingAcc, setLoadingAcc] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/accounts');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAdmins(json.data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.currentPassword || !passData.newPassword || !passData.confirmPassword) {
      showToast.error('Vui lòng điền đầy đủ các thông tin đổi mật khẩu');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      showToast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    if (passData.newPassword.length < 6) {
      showToast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoadingPass(true);
    try {
      const res = await fetch('/api/admin/accounts/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passData.currentPassword,
          newPassword: passData.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Đổi mật khẩu tài khoản thành công!');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast.error(data.error || 'Đổi mật khẩu thất bại');
      }
    } catch {
      showToast.error('Lỗi kết nối máy chủ');
    }
    setLoadingPass(false);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.fullName || !newAcc.email || !newAcc.password) {
      showToast.error('Điền đầy đủ Họ tên, Email và Mật khẩu khởi tạo');
      return;
    }

    setLoadingAcc(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Tạo tài khoản cán bộ thành công!');
        setNewAcc({ fullName: '', email: '', password: '', role: 'admin' });
        fetchAdmins();
      } else {
        showToast.error(data.error || 'Tạo tài khoản thất bại');
      }
    } catch {
      showToast.error('Lỗi kết nối máy chủ');
    }
    setLoadingAcc(false);
  };

  const handleDeleteAccount = async (admin: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${admin.full_name || admin.fullName || admin.username}"?`)) return;

    try {
      const res = await fetch(`/api/admin/accounts?id=${admin.id || admin._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Đã xóa tài khoản');
        fetchAdmins();
      } else {
        showToast.error(data.error || 'Không thể xóa tài khoản');
      }
    } catch {
      showToast.error('Lỗi kết nối máy chủ');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          Phân Quyền & Quản Lý Tài Khoản
        </h1>
        <p className="text-[14px] text-slate-500 font-medium mt-1">Quản lý danh sách truy cập cán bộ và đổi mật khẩu bảo mật cá nhân.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Admins List & Create Form */}
        <div className="space-y-6">
          {/* List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-[#005496]" />
                Danh sách Quản trị viên
              </h2>
              <Badge className="bg-[#005496] text-white font-bold">{admins.length} Tài khoản</Badge>
            </div>
            
            <div className="p-0">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#005496]" /></div>
              ) : admins.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">Chưa có tài khoản quản trị nào.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                  {admins.map((admin) => {
                    const name = admin.full_name || admin.fullName || admin.username || 'Admin';
                    const email = admin.username || admin.email;
                    const role = admin.role || 'admin';
                    const isSuper = role === 'superadmin' || role === 'super_admin';

                    return (
                      <div key={admin.id || admin._id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#005496] to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-slate-800 flex items-center gap-2 truncate">
                              <span className="truncate">{name}</span>
                              {isSuper && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 uppercase">Super Admin</Badge>}
                            </p>
                            <p className="text-[12px] text-slate-500 font-medium truncate">{email}</p>
                          </div>
                        </div>

                        {!isSuper && (
                          <button
                            onClick={() => handleDeleteAccount(admin)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa tài khoản này"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Create Account Form */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                Cấp tài khoản truy cập mới
              </h2>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <p className="text-[13px] text-slate-500 font-medium">Khởi tạo nhanh tài khoản cho cán bộ quản trị chung hệ thống UFM.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Họ Tên Cán bộ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newAcc.fullName}
                    onChange={e => setNewAcc({ ...newAcc, fullName: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] transition-all"
                    placeholder="VD: Phạm Văn Khoa"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Email / Đăng nhập <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={newAcc.email}
                    onChange={e => setNewAcc({ ...newAcc, email: e.target.value })}
                    className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] transition-all"
                    placeholder="canbo@ufm.edu.vn"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Mật khẩu Khởi tạo <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={newAcc.password}
                  onChange={e => setNewAcc({ ...newAcc, password: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] transition-all"
                  placeholder="Mật khẩu tối thiểu 6 ký tự"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loadingAcc}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-sm gap-2"
                >
                  {loadingAcc ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Tạo tài khoản ngay
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Change Password Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <Key size={18} className="text-amber-500" />
                Đổi mật khẩu cá nhân
              </h2>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <p className="text-[13px] text-slate-500 font-medium">Khuyên dùng mật khẩu mạnh bao gồm chữ hoa, chữ thường và chữ số để bảo vệ tài khoản.</p>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passData.currentPassword}
                    onChange={e => setPassData({ ...passData, currentPassword: e.target.value })}
                    className="w-full h-10 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] transition-all"
                    placeholder="Nhập mật khẩu đang dùng"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Mật khẩu mới <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passData.newPassword}
                    onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                    className="w-full h-10 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] transition-all"
                    placeholder="Mật khẩu mới (Tối thiểu 6 ký tự)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={passData.confirmPassword}
                  onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#005496]/20 focus:border-[#005496] transition-all"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loadingPass}
                  className="bg-[#005496] hover:bg-[#004377] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-sm gap-2"
                >
                  {loadingPass ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Cập nhật mật khẩu
                </Button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
