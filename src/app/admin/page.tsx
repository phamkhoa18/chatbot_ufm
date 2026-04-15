'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, TrendingUp, MessageSquare, Loader2, Star, Clock,
  BarChart3, ThumbsUp, ArrowUpRight, Activity, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { format } from 'date-fns';
import Link from 'next/link';

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, leadsRes, sessionsRes] = await Promise.all([
        fetch(`/api/admin/analytics?days=${range}`),
        fetch('/api/admin/leads?limit=5'),
        fetch('/api/admin/sessions?limit=5'),
      ]);

      const analyticsJson = await analyticsRes.json();
      const leadsJson = await leadsRes.json();
      const sessionsJson = await sessionsRes.json();

      if (analyticsJson.success) setAnalytics(analyticsJson.data);
      if (leadsJson.success) setRecentLeads(leadsJson.data || []);
      if (sessionsJson.success) setRecentSessions(sessionsJson.data || []);
    } catch { }
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData() }, [fetchData]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#005496]" />
      </div>
    );
  }

  const { overview, leads, feedback, topTopics, dailyChats } = analytics;

  const statsCards = [
    { label: 'Tổng cuộc chat', value: overview.totalSessions, icon: MessageSquare, color: '#0ea5e9', gradient: 'from-[#0ea5e9]/20 to-transparent' },
    { label: 'Khách tiềm năng', value: overview.totalLeads, icon: Users, color: '#22c55e', gradient: 'from-[#22c55e]/20 to-transparent' },
    { label: 'Tỷ lệ chuyển đổi', value: `${overview.conversionRate}%`, icon: TrendingUp, color: '#8b5cf6', gradient: 'from-[#8b5cf6]/20 to-transparent' },
    { label: 'Tỷ lệ hài lòng', value: `${overview.satisfactionRate}%`, icon: ThumbsUp, color: '#f59e0b', gradient: 'from-[#f59e0b]/20 to-transparent' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-800">
            Xin chào, <span className="text-[#005496]">Quản trị viên</span> 👋
          </h1>
          <p className="text-[15px] text-slate-500 font-medium mt-1 inline-flex items-center gap-2">
            Tổng quan hiệu suất Chatbot Tuyển sinh UFM hôm nay.
          </p>
        </div>
        <div className="text-right flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-5 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-300 ${
                  range === d 
                    ? 'bg-white text-[#005496] shadow-sm ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 transition-all hover:border-[#005496]/40 hover:shadow-lg hover:shadow-[#005496]/5 group cursor-default" key={stat.label}>
            <div className="flex items-center justify-between mb-4">
               <h3 className="tracking-tight text-[14px] font-semibold text-slate-500 uppercase">{stat.label}</h3>
               <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                 <stat.icon size={16} strokeWidth={2.5} />
               </div>
            </div>
            <div className="flex flex-col gap-1">
               <div className="text-[28px] font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Chat Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-[#0ea5e9]" />
              Lưu lượng trò chuyện
            </h3>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyChats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 700 }}
                  labelFormatter={(v) => format(new Date(v), 'EEEE, dd/MM/yyyy')}
                  formatter={(value: any) => [value, 'Tin nhắn / Cuộc chat']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fill="url(#colorChat)"
                  activeDot={{ r: 6, fill: '#fff', stroke: '#0ea5e9', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-[16px] font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-[#8b5cf6]" />
            Phân tích tỷ lệ chuyển đổi
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Tổng Tương Tác', value: overview.totalSessions, color: '#3b82f6', width: 100 },
              { label: 'Thu thập Leads', value: overview.totalLeads, color: '#8b5cf6', width: overview.totalSessions > 0 ? (overview.totalLeads / overview.totalSessions) * 100 : 0 },
              { label: 'Chờ xử lý', value: leads.new, color: '#f43f5e', width: overview.totalLeads > 0 ? (leads.new / overview.totalLeads) * 100 : 0 },
              { label: 'Đang liên hệ', value: leads.contacted, color: '#f59e0b', width: overview.totalLeads > 0 ? (leads.contacted / overview.totalLeads) * 100 : 0 },
              { label: 'Đã nhập học', value: leads.enrolled, color: '#22c55e', width: overview.totalLeads > 0 ? (leads.enrolled / overview.totalLeads) * 100 : 0 },
            ].map((item, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                  <span className="text-[14px] font-black text-slate-800 tracking-tight">{item.value}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80"
                    style={{ width: `${Math.max(item.width, item.value > 0 ? 3 : 0)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Topics */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-[16px] font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Star size={18} className="text-[#f59e0b]" fill="currentColor" />
            Vấn đề được quan tâm
          </h3>
          {topTopics.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center flex-col gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                <Star size={20} className="text-slate-300" />
              </div>
            </div>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topTopics.slice(0, 6)} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="topic" width={140} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 600, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [value, 'Lượt hỏi']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24} animationDuration={1500}>
                    {topTopics.slice(0, 6).map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-slate-500" />
              Hoạt động gần đây
            </h3>
            <Link href="/admin/lich-su-chat" className="text-[13px] font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors flex items-center gap-1 group">
              Xem tất cả <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto">
            {recentSessions.length === 0 && recentLeads.length === 0 ? (
               <div className="h-full flex items-center justify-center flex-col gap-3 py-10">
                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                   <Clock size={20} className="text-slate-300" />
                 </div>
                 <p className="text-[13px] text-slate-400 font-medium">Chưa có hoạt động nào được ghi nhận.</p>
               </div>
            ) : (
              <>
                {recentLeads.slice(0, 2).map((lead: any) => (
                  <div key={lead._id} className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50/50 to-transparent border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-200">
                      <Users size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                        Khách hàng mới: {lead.fullName}
                      </p>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                        <span>AI Đánh giá: <strong className="text-emerald-600">{lead.aiAnalysis?.score || 0}/10</strong> điểm</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{format(new Date(lead.createdAt), 'HH:mm - dd/MM/yyyy')}</span>
                      </p>
                    </div>
                  </div>
                ))}
                
                {recentSessions.slice(0, 3).map((session: any) => (
                  <div key={session._id} className="group flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={18} className="text-[#0ea5e9]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-slate-700 truncate group-hover:text-[#0ea5e9] transition-colors">
                        Phiên chat: {session.visitorName || 'Ẩn danh'} <span className="text-slate-400 font-normal">({session.metadata?.totalMessages || 0} tin nhắn)</span>
                      </p>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5 flex items-center gap-2 truncate">
                         <span>{format(new Date(session.createdAt), 'HH:mm - dd/MM/yyyy')}</span>
                         {session.topics?.length > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="truncate">{session.topics.slice(0, 2).join(', ')}</span>
                            </>
                         )}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
