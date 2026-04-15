'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Search, Users, Loader2, Trash2, CheckCircle2,
  Clock, Phone, Mail, MessageSquare, Bot, Star, Info, BookOpen
} from 'lucide-react'
import { format } from 'date-fns'
import { showToast } from '@/lib/toast'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [mounted, setMounted] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '15')
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/leads?${params}`)
      const json = await res.json()
      if (json.success) {
        setLeads(json.data)
        setTotal(json.total)
        setTotalPages(json.totalPages || 1)
      }
    } catch { }
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { 
    setMounted(true)
    fetchData() 
  }, [fetchData])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        showToast.success('Đã cập nhật trạng thái')
        fetchData()
      }
    } catch {
      showToast.error('Lỗi cập nhật')
    }
  }

  const handleViewLead = async (lead: any) => {
    setSelectedLead(lead)
    if (!lead.isRead) {
      // Mark as read locally and hit API
      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, isRead: true } : l))
      try {
        await fetch(`/api/admin/leads/${lead._id}`, {
          method: 'PUT',
          body: JSON.stringify({ isRead: true })
        })
        // NotificationProvider auto-polls every 30s to clear badge, or user can reload
      } catch (e) {}
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa thông tin khách hàng này?')) return
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        showToast.success('Đã xóa')
        fetchData()
      }
    } catch {
      showToast.error('Lỗi xóa')
    }
  }

  const [selectedLead, setSelectedLead] = useState<any>(null)

  const statusTabs = [
    { label: 'Tất cả', value: '' },
    { label: 'Mới (Chưa LH)', value: 'New' },
    { label: 'Đã liên hệ', value: 'Contacted' },
    { label: 'Đã nộp HS', value: 'Enrolled' }
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#005496]" />
            Khách hàng tiềm năng (CRM)
          </h1>
          <p className="text-[15px] text-slate-500 font-medium mt-1">Tổng cộng <span className="text-[#005496] font-bold">{total}</span> liên hệ thu thập từ Bot</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-[#005496] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 w-full lg:max-w-sm relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#005496] transition-colors" />
        <input
          type="text" placeholder="Tìm theo tên, SĐT, email..."
          className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-[#005496]/50 focus:border-[#005496] transition-all shadow-sm"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center p-14">
            <Loader2 className="w-8 h-8 animate-spin text-[#005496]" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-center">
            <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Chưa có ai sử dụng Bot</h3>
            <p className="text-slate-500 max-w-sm mt-1 text-xs font-medium">Khách hàng sẽ hiển thị ở đây khi họ nhập thông tin vào chatbot.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="w-full text-slate-600 min-w-[1000px]">
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[50px] text-center font-semibold text-slate-500 h-9 py-2 text-[13px]">STT</TableHead>
                    <TableHead className="h-9 py-2 px-4 text-[13px] font-semibold text-slate-500">Khách hàng</TableHead>
                    <TableHead className="h-9 py-2 px-4 text-[13px] font-semibold text-slate-500">Đánh giá (AI UFM)</TableHead>
                    <TableHead className="h-9 py-2 px-4 text-[13px] font-semibold text-slate-500 text-center">Trạng thái</TableHead>
                    <TableHead className="h-9 py-2 px-4 text-[13px] font-semibold text-slate-500 text-right">Quản lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {leads.map((lead: any, idx: number) => {
                    const isPotential = lead.aiAnalysis?.isPotential
                    return (
                      <TableRow key={lead._id} className={`hover:bg-slate-50/60 transition-colors group border-b border-slate-100 ${!lead.isRead ? 'bg-[#005496]/5' : ''}`}>
                        <TableCell className="py-3 px-3 text-center align-start pt-4">
                          <span className="text-[13px] font-semibold text-slate-400">{(page - 1) * 15 + idx + 1}</span>
                        </TableCell>

                        <TableCell className="py-3 px-4 pt-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[14px] font-bold text-slate-800 flex items-center gap-1.5">
                              {lead.fullName}
                              {!lead.isRead && <span className="w-2 h-2 rounded-full bg-rose-500" title="Chưa đọc" />}
                            </span>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#005496]" />{lead.phone}</span>
                              {lead.email && <span className="flex items-center gap-1 border-l border-slate-200 pl-3"><Mail className="w-3 h-3 text-rose-500" />{lead.email}</span>}
                            </div>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-1"><Clock className="w-3 h-3" />Chat lúc: {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 pt-4 cursor-pointer" onClick={() => handleViewLead(lead)}>
                          <div className="flex flex-col gap-1.5 flex-1 max-w-[400px]">
                            <div className="flex items-center gap-2">
                              {isPotential ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-1.5 py-0">Tiềm năng Cao</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-400 border-slate-300">Quan tâm nhẹ</Badge>
                              )}
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                                <Star className="w-3 h-3" /> Điểm: {lead.aiAnalysis?.score || 0}/10
                              </span>
                            </div>
                            <p className="text-[12px] text-slate-700 leading-relaxed font-medium line-clamp-2" title={lead.aiAnalysis?.summary}>
                              {lead.aiAnalysis?.summary || 'Đang chờ phân tích...'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 px-4 text-center pt-4 align-top">
                          <select
                            value={lead.status}
                            onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-md outline-none cursor-pointer border ${
                              lead.status === 'New' ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm shadow-rose-100' :
                              lead.status === 'Contacted' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                              lead.status === 'Enrolled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            <option value="New">Chưa liên hệ 🔴</option>
                            <option value="Contacted">Đã liên hệ 🔵</option>
                            <option value="Enrolled">Đã nộp HS 🟢</option>
                          </select>
                        </TableCell>

                        <TableCell className="py-3 px-4 text-right pt-4 align-top">
                           <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded text-[#005496] bg-[#005496]/5 hover:bg-[#005496]/10" onClick={() => setSelectedLead(lead)} title="Xem chi tiết">
                              <Info className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleDelete(lead._id)} variant="ghost" size="sm" className="h-7 w-7 p-0 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50" title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <span className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Hiển thị Trang <span className="font-bold text-slate-800">{page}</span> / {totalPages}</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(Math.max(1, page - 1))} 
                    disabled={page <= 1}
                    className="h-8 px-4 text-[12px] font-bold shadow-sm"
                  >
                    Trước
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(Math.min(totalPages, page + 1))} 
                    disabled={page >= totalPages}
                    className="h-8 px-4 text-[12px] font-bold shadow-sm"
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {mounted && selectedLead && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-slate-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#005496]" /> Chi tiết báo cáo khách hàng
              </h3>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                <Trash2 className="w-4 h-4 opacity-0" />
                <div className="w-4 h-4 relative flex items-center justify-center font-bold text-lg">&times;</div>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">Thông tin liên hệ</h4>
                  <p className="text-[15px] font-bold text-slate-800">{selectedLead.fullName}</p>
                  <p className="text-[13px] font-medium text-slate-600 mt-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#005496]"/> {selectedLead.phone}</p>
                  <p className="text-[13px] font-medium text-slate-600 mt-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 opacity-50"/> {selectedLead.email || 'Không có email'}</p>
                  <p className="text-[12px] font-medium text-slate-400 mt-2">Đăng ký lúc: {format(new Date(selectedLead.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col justify-center items-center text-center">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-amber-600/70 mb-2">Điểm tiềm năng (AI Chấm)</h4>
                  <div className="text-[36px] font-black text-amber-500 leading-none">{selectedLead.aiAnalysis?.score || 0}<span className="text-[18px] text-amber-300">/10</span></div>
                  {selectedLead.aiAnalysis?.isPotential ? (
                    <Badge className="mt-2 bg-emerald-500 text-white border-0 shadow-sm">Có khả năng đăng ký</Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2 text-slate-500 border-slate-300 bg-white">Chỉ hỏi thăm / Ít tiềm năng</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800 mb-1.5 flex items-center gap-1.5"><Bot className="w-4 h-4 text-[#005496]" /> Tóm tắt nhu cầu (AI UFM)</h4>
                  <div className="bg-[#005496]/5 p-4 rounded-xl text-[14px] text-slate-700 leading-relaxed font-medium border border-[#005496]/10">
                    {selectedLead.aiAnalysis?.summary || 'Hệ thống AI không thể khởi tạo tóm tắt đối với bình luận rác hoặc lỗi mô hình.'}
                  </div>
                </div>

                <div>
                  <h4 className="text-[14px] font-bold text-slate-800 mb-2 mt-4 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-600" /> Ngành/Khóa học Khách quan tâm</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.aiAnalysis?.interestedPrograms?.length > 0 ? (
                      selectedLead.aiAnalysis.interestedPrograms.map((p: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[13px] font-bold shadow-sm">{p}</span>
                      ))
                    ) : (
                      <span className="text-[13px] text-slate-500 italic">Khách hàng chưa đề cập đến ngành học cụ thể.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <Button onClick={() => setSelectedLead(null)} variant="outline" className="text-[13px] font-bold h-9">Đóng lại</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
