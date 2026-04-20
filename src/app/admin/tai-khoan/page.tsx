'use client';

import { useState, useEffect } from 'react';
import { Users, Key, Plus, ShieldAlert, Loader2, Save, Trash2, Mail, Lock } from 'lucide-react';
import { showToast } from '@/lib/toast';

export default function AccountManagementPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newAcc, setNewAcc] = useState({ fullName: '', email: '', password: '' });
  const [loadingAcc, setLoadingAcc] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/accounts');
      const json = await res.json();
      if (json.success) setAdmins(json.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);



  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.fullName || !newAcc.email || !newAcc.password) {
      showToast.error('Điền đủ thông tin');
      return;
    }
    
    setLoadingAcc(true);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAcc)
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Khởi tạo tài khoản thành công!');
        setNewAcc({ fullName: '', email: '', password: '' });
        fetchAdmins();
      } else {
        showToast.error(data.error || 'Tạo tài khoản thất bại');
      }
    } catch {
      showToast.error('Lỗi máy chủ');
    }
    setLoadingAcc(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          Phân Quyền & Tài Khoản
        </h1>
        <p className="text-[14px] text-slate-500 font-medium mt-1">Quản lý danh sách truy cập hệ thống và bảo mật cá nhân.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Col: Admins List */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-[#005496]" />
                Danh sách Quản trị viên
              </h2>
              <span className="bg-[#005496]/10 text-[#005496] px-2 py-0.5 rounded-full text-[12px] font-bold">{admins.length} Tài khoản</span>
            </div>
            
            <div className="p-0">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#005496]" /></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {admins.map((admin) => (
                    <div key={admin._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {admin.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-800">
                            {admin.fullName}
                            {admin.role === 'superadmin' && <span className="ml-2 text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Super Admin</span>}
                          </p>
                          <p className="text-[13px] text-slate-500 font-medium">{admin.email}</p>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Chưa hỗ trợ xóa tạm thời">
                         <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                Cấp tài khoản truy cập mới
              </h2>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <p className="text-[13px] text-slate-500 font-medium mb-4">Bạn có thể tạo nhanh tài khoản cho cán bộ khác vào chung hệ thống.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Họ Tên</label>
                  <input type="text" required value={newAcc.fullName} onChange={e => setNewAcc({ ...newAcc, fullName: e.target.value })} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:ring-2 focus:ring-[#005496]/50 focus:border-[#005496]" placeholder="Tên cán bộ" />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Tên đăng nhập (Email)</label>
                  <input type="text" required value={newAcc.email} onChange={e => setNewAcc({ ...newAcc, email: e.target.value })} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:ring-2 focus:ring-[#005496]/50 focus:border-[#005496]" placeholder="Tài khoản hệ thống" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block mb-2">Mật khẩu Khởi tạo</label>
                <input type="password" required value={newAcc.password} onChange={e => setNewAcc({ ...newAcc, password: e.target.value })} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:ring-2 focus:ring-[#005496]/50 focus:border-[#005496]" placeholder="Tối thiểu 6 ký tự" />
              </div>
              <button type="submit" disabled={loadingAcc} className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ml-auto mt-2">
                {loadingAcc ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Tạo tài khoản ngay
              </button>
            </form>
          </div>
        </div>



      </div>
    </div>
  );
}
