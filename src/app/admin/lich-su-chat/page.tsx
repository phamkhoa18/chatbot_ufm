'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Search, Loader2, Clock, User, Bot, Flag, FlagOff,
  ChevronLeft, ChevronRight, Calendar, Filter, StickyNote,
  ThumbsUp, ThumbsDown, X, Trash2, AlertCircle, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { showToast } from '@/lib/toast';

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Selected session for detail view
  const [selected, setSelected] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (flaggedOnly) params.set('flagged', 'true');

      const res = await fetch(`/api/admin/sessions?${params}`);
      const json = await res.json();
      if (json.success) {
        setSessions(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch { }
    setLoading(false);
  }, [page, search, statusFilter, flaggedOnly]);

  useEffect(() => { fetchSessions() }, [fetchSessions]);

  const openSession = async (session: any) => {
    setSelected(session);
    setAdminNotes(session.adminNotes || '');
  };

  const handleToggleFlag = async (session: any) => {
    try {
      const res = await fetch(`/api/admin/sessions/${session._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: !session.flagged }),
      });
      const json = await res.json();
      if (json.success) {
        showToast.success(session.flagged ? 'Đã bỏ đánh dấu' : 'Đã đánh dấu cần xem lại');
        setSessions(prev => prev.map(s => s._id === session._id ? { ...s, flagged: !s.flagged } : s));
        if (selected?._id === session._id) setSelected({ ...selected, flagged: !session.flagged });
      }
    } catch { showToast.error('Lỗi cập nhật'); }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/admin/sessions/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      const json = await res.json();
      if (json.success) {
        showToast.success('Đã lưu ghi chú');
        setSessions(prev => prev.map(s => s._id === selected._id ? { ...s, adminNotes } : s));
      }
    } catch { showToast.error('Lỗi lưu ghi chú'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa cuộc trò chuyện này?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast.success('Đã xóa');
        if (selected?._id === id) setSelected(null);
        fetchSessions();
      }
    } catch { showToast.error('Lỗi xóa'); }
  };

  const getFeedbackForMsg = (session: any, msgIdx: number) => {
    return session.feedback?.find((f: any) => f.messageIndex === msgIdx);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#005496]" />
          Lịch sử Trò chuyện
        </h1>
        <p className="text-[14px] text-slate-500 font-medium mt-1">
          Xem toàn bộ hội thoại giữa người dùng và Tuyển sinh UFM · Tổng: <span className="text-[#005496] font-bold">{total}</span> cuộc
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-5">
        <div className="flex-1 w-full md:max-w-sm relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#005496] transition-colors" />
          <input
            type="text"
            placeholder="Tìm theo nội dung, tên, SĐT, chủ đề..."
            className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#005496]/50 focus:border-[#005496] transition-all shadow-sm"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            {[
              { label: 'Tất cả', value: '' },
              { label: 'Hoàn tất', value: 'completed' },
              { label: 'Đang chat', value: 'active' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all whitespace-nowrap ${statusFilter === tab.value ? 'bg-[#005496] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setFlaggedOnly(!flaggedOnly); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${flaggedOnly ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}
          >
            <Flag size={12} />
            Đã đánh dấu
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-5">
        {/* Session List */}
        <div className={`${selected ? 'hidden lg:block lg:w-[420px] lg:flex-shrink-0' : 'w-full'} transition-all`}>
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#005496]" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Chưa có cuộc trò chuyện nào</h3>
                <p className="text-slate-500 max-w-sm mt-1 text-xs font-medium">Dữ liệu sẽ xuất hiện khi có người dùng tương tác với Chatbot.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((session: any) => {
                  const isSelected = selected?._id === session._id;
                  const msgCount = session.metadata?.totalMessages || session.messages?.length || 0;
                  const feedbackCount = session.feedback?.length || 0;
                  const thumbsUpCount = (session.feedback || []).filter((f: any) => f.rating === 'up').length;

                  return (
                    <div
                      key={session._id}
                      onClick={() => openSession(session)}
                      className={`flex items-start gap-3 p-4 cursor-pointer transition-all hover:bg-slate-50 ${isSelected ? 'bg-[#005496]/5 border-l-2 border-l-[#005496]' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#005496]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {session.visitorName ? (
                          <User size={15} className="text-[#005496]" />
                        ) : (
                          <Bot size={15} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold text-slate-700 truncate">
                            {session.visitorName || 'Khách ẩn danh'}
                          </p>
                          {session.flagged && <Flag size={11} className="text-amber-500 flex-shrink-0" />}
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate">
                          {session.messages?.[session.messages.length - 1]?.content?.slice(0, 60) || 'Không có tin nhắn'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(session.createdAt), 'dd/MM HH:mm')}</span>
                          <span className="flex items-center gap-1"><MessageSquare size={10} /> {msgCount}</span>
                          {feedbackCount > 0 && (
                            <span className="flex items-center gap-1 text-emerald-500"><ThumbsUp size={10} /> {thumbsUpCount}/{feedbackCount}</span>
                          )}
                        </div>
                        {session.topics?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {session.topics.slice(0, 3).map((t: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 bg-[#005496]/5 text-[#005496] text-[10px] font-semibold rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <span className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Hiển thị Trang <span className="font-bold text-slate-800">{page}</span> / {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 h-8 px-4 border border-slate-200 bg-white rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    <ChevronLeft size={14} /> Trước
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1.5 h-8 px-4 border border-slate-200 bg-white rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    Tiếp <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Detail Panel */}
        {selected && (
          <div className="flex-1 w-full relative">
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm lg:sticky lg:top-4 flex flex-col h-auto lg:max-h-[calc(100vh-8rem)]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-[#005496] shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="lg:hidden p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">{selected.visitorName || 'Khách ẩn danh'}</h3>
                    <p className="text-[11px] text-white/70">
                      {format(new Date(selected.createdAt), 'dd/MM/yyyy HH:mm')} · {selected.metadata?.totalMessages || 0} tin nhắn
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleFlag(selected)}
                    className={`p-2 rounded-lg transition-all ${selected.flagged ? 'text-amber-300 bg-amber-500/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title={selected.flagged ? 'Bỏ đánh dấu' : 'Đánh dấu cần xem lại'}
                  >
                    <Flag size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(selected._id)}
                    className="p-2 rounded-lg text-white/60 hover:text-rose-300 hover:bg-white/10 transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="hidden lg:flex p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="px-5 py-6 flex-1 overflow-y-auto bg-[#f8fafc] space-y-4 min-h-[300px]">
                {(selected.messages || []).map((msg: any, i: number) => {
                  const isBot = msg.role === 'bot';
                  const fb = getFeedbackForMsg(selected, i);
                  return (
                    <div key={i} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] ${isBot ? '' : ''}`}>
                        <div className={`text-[14px] leading-[1.7] px-4 py-3 rounded-2xl ${isBot
                          ? 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                          : 'bg-[#005496] text-white rounded-br-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[10px] text-slate-400">
                            {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : ''}
                          </span>
                          {fb && (
                            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${fb.rating === 'up' ? 'text-emerald-500' : 'text-rose-400'}`}>
                              {fb.rating === 'up' ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                              {fb.rating === 'up' ? 'Hữu ích' : 'Chưa tốt'}
                            </span>
                          )}
                          {isBot && msg.source && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{msg.source}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Topics & Info */}
              <div className="px-5 py-4 border-t border-slate-100 space-y-3">
                {selected.visitorPhone && (
                  <div className="flex items-center gap-4 text-[12px] text-slate-600">
                    <span className="font-medium">📞 {selected.visitorPhone}</span>
                    {selected.visitorEmail && <span className="font-medium">📧 {selected.visitorEmail}</span>}
                  </div>
                )}
                {selected.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.topics.map((t: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-[#005496]/5 text-[#005496] text-[11px] font-semibold rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <StickyNote size={13} className="text-amber-500" />
                  <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">Ghi chú Admin</span>
                </div>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Thêm ghi chú về cuộc trò chuyện này..."
                  className="w-full h-20 bg-white border border-slate-200 rounded-lg p-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#005496]/50 resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  className="mt-2 px-4 py-1.5 bg-[#005496] text-white text-[12px] font-bold rounded-lg hover:bg-[#004078] transition-colors"
                >
                  Lưu ghi chú
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
