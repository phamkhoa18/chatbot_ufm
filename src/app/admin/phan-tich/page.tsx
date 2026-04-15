'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Loader2, ThumbsUp, ThumbsDown, MessageSquare,
  TrendingUp, Users, Clock, Star, Sparkles, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#005496', '#0284c7', '#7c3aed', '#059669', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#84cc16'];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${range}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { }
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData() }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#005496]" />
      </div>
    );
  }

  const { overview, feedback, topTopics, topPrograms, dailyChats } = data;

  // Prepare satisfaction pie data
  const satisfactionData = [
    { name: 'Hài lòng 👍', value: feedback.thumbsUp, fill: '#059669' },
    { name: 'Chưa tốt 👎', value: feedback.thumbsDown, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#005496]" />
            Phân tích Chatbot
          </h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">Đo lường hiệu suất và chất lượng tư vấn của Tuyển sinh UFM.</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${range === d ? 'bg-[#005496] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Tổng cuộc chat', value: overview.totalSessions, icon: MessageSquare, color: '#005496' },
          { label: 'Leads thu được', value: overview.totalLeads, icon: Users, color: '#059669' },
          { label: 'Chuyển đổi', value: `${overview.conversionRate}%`, icon: TrendingUp, color: '#7c3aed' },
          { label: 'TB tin nhắn/chat', value: overview.avgMessagesPerSession, icon: Activity, color: '#0284c7' },
          { label: 'Mức hài lòng', value: `${overview.satisfactionRate}%`, icon: ThumbsUp, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-[24px] font-black text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily trend - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[#005496]" />
            Xu hướng Trò chuyện & Tin nhắn
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChats}>
                <defs>
                  <linearGradient id="gradChat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005496" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#005496" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600 }}
                  labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy')}
                />
                <Area type="monotone" dataKey="count" name="Cuộc chat" stroke="#005496" strokeWidth={2} fill="url(#gradChat)" dot={false} />
                <Area type="monotone" dataKey="totalMessages" name="Tin nhắn" stroke="#7c3aed" strokeWidth={1.5} fill="url(#gradMsg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Satisfaction Pie */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ThumbsUp size={16} className="text-emerald-500" />
            Mức độ Hài lòng
          </h3>
          {feedback.total === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-center">
              <ThumbsUp className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-[13px] text-slate-400">Chưa có phản hồi 👍👎 nào.</p>
              <p className="text-[11px] text-slate-300 mt-1">Dữ liệu sẽ hiện khi người dùng đánh giá câu trả lời.</p>
            </div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={satisfactionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {satisfactionData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value, entry: any) => (
                      <span className="text-[12px] font-semibold text-slate-600">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600 }}
                    formatter={(value: any) => [value, 'Lượt']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="text-center mt-2">
            <p className="text-[13px] text-slate-500">
              Tổng phản hồi: <span className="font-bold text-slate-700">{feedback.total}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Topics */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Top Chủ đề được hỏi
          </h3>
          {topTopics.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-8">Chưa có dữ liệu chủ đề.</p>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTopics.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="topic" width={130} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600 }} formatter={(v: any) => [v, 'Lượt hỏi']} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                    {topTopics.slice(0, 10).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Programs */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Star size={16} className="text-[#005496]" />
            Ngành học được Quan tâm nhất
          </h3>
          {topPrograms.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-8">Chưa có dữ liệu ngành học.</p>
          ) : (
            <div className="space-y-3">
              {topPrograms.map((prog: any, i: number) => {
                const maxCount = topPrograms[0]?.count || 1;
                const width = (prog.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-slate-700">{prog.program}</span>
                      <span className="text-[12px] font-bold text-slate-500">{prog.count} lượt</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(width, 3)}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
