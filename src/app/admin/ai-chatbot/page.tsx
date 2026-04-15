'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Bot, Upload, FileText, Trash2, Search,
  CheckCircle2, XCircle, Clock, Loader2, AlertCircle,
  RefreshCw, Database, Activity, Zap, Eye,
  GraduationCap, Server, HardDrive, Layers, X, ChevronRight, Ban,
  TrendingUp, BarChart3, CircleDot, Wifi, WifiOff, Hash, FolderTree,
  PenLine, Sparkles, FileDown
} from 'lucide-react'
import { format } from 'date-fns'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/* ═══════════════════════════════════════
   Types
   ═══════════════════════════════════════ */
interface VectorDbDoc {
  source: string
  program_level: string | null
  program_name: string | null
  academic_year: string | null
  chunk_count: number
  total_chars: number
  is_active: boolean
  created_at: string | null
  updated_at: string | null
}

interface VectorDbStats {
  db_status: string
  total_documents: number
  total_chunks: number
  active_chunks: number
  inactive_chunks: number
  total_characters: number
  has_embeddings: number
  by_level: Record<string, { documents: number; chunks: number }>
  recent_documents?: { source: string; chunks: number; last_updated: string }[]
}

interface IngestionTaskData {
  task_id: string
  status: string
  progress?: number
  result?: { total_chunks: number }
  reason?: string
  created_at?: string
  updated_at?: string
}

interface ChunkDetail {
  chunk_id: string
  chunk_level: string
  parent_id: string | null
  section_path: string | null
  section_name: string | null
  program_name: string | null
  program_level: string | null
  ma_nganh: string | null
  academic_year: string | null
  content: string
  content_preview: string
  char_count: number
  is_active: boolean
  extra: any
  created_at: string | null
  updated_at: string | null
}

const LEVEL_MAP: Record<string, string> = {
  thac_si: 'Thạc sĩ',
  tien_si: 'Tiến sĩ',
  dai_hoc: 'Đại học',
  chung: 'Thông tin chung',
  unknown: 'Khác',
}

const LEVEL_COLORS: Record<string, string> = {
  thac_si: 'bg-violet-50 text-violet-700 border-violet-200',
  tien_si: 'bg-amber-50 text-amber-700 border-amber-200',
  dai_hoc: 'bg-sky-50 text-sky-700 border-sky-200',
  chung: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unknown: 'bg-slate-50 text-slate-600 border-slate-200',
}

function formatChars(chars: number) {
  if (!chars) return '0'
  if (chars >= 1000000) return (chars / 1000000).toFixed(1) + 'M'
  if (chars >= 1000) return (chars / 1000).toFixed(1) + 'K'
  return chars.toString()
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function AIChatbotAdminPage() {
  const [activeTab, setActiveTab] = useState<'vectordb' | 'upload' | 'compose' | 'tasks'>('vectordb')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Data state
  const [vectorDocs, setVectorDocs] = useState<VectorDbDoc[]>([])
  const [stats, setStats] = useState<VectorDbStats | null>(null)
  const [tasks, setTasks] = useState<IngestionTaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Detail modal state
  const [detailSource, setDetailSource] = useState<string | null>(null)
  const [detailChunks, setDetailChunks] = useState<ChunkDetail[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null)
  const [detailSearch, setDetailSearch] = useState('')

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadLevel, setUploadLevel] = useState('')
  const [uploadProgram, setUploadProgram] = useState('')
  const [uploadYear, setUploadYear] = useState('')
  const [uploadReferenceUrl, setUploadReferenceUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // Compose state
  const [composeTitle, setComposeTitle] = useState('')
  const [composeContent, setComposeContent] = useState('')
  const [composeFileName, setComposeFileName] = useState('')
  const [composeLevel, setComposeLevel] = useState('')
  const [composeProgram, setComposeProgram] = useState('')
  const [composeYear, setComposeYear] = useState('')
  const [composeReferenceUrl, setComposeReferenceUrl] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [composeError, setComposeError] = useState('')
  const [composeSuccess, setComposeSuccess] = useState('')
  const [composePreview, setComposePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editSource, setEditSource] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // ═══════ AUTH-AWARE FETCH — auto redirect to login on 401 ═══════
  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options)
    if (res.status === 401 || res.redirected) {
      window.location.href = '/admin'
      throw new Error('Session expired')
    }
    // Check if the response is HTML (redirect page) instead of JSON
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      window.location.href = '/admin'
      throw new Error('Session expired')
    }
    return res
  }, [])

  // ═══════ DATA FETCHING ═══════
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [docRes, taskRes] = await Promise.all([
        authFetch('/api/admin/ai-documents').then(r => r.json()),
        authFetch('/api/admin/ai-documents/tasks').then(r => r.json()),
      ])

      if (docRes.success && docRes.data) {
        setVectorDocs(docRes.data.vectorDb || [])
        setStats(docRes.data.stats || null)
      }
      if (taskRes.success && taskRes.data) {
        setTasks(taskRes.data)
      }
    } catch (err: any) {
      if (err.message === 'Session expired') return // Already redirecting
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    loadData()
    const timer = setInterval(async () => {
      try {
        const taskRes = await authFetch('/api/admin/ai-documents/tasks').then(r => r.json())
        if (taskRes.success && taskRes.data) setTasks(taskRes.data)
      } catch {}
    }, 8000)
    return () => clearInterval(timer)
  }, [loadData, authFetch])

  // ═══════ FILTER ═══════
  const filteredDocs = vectorDocs.filter(doc => {
    const matchSearch = doc.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.program_name && doc.program_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchLevel = filterLevel === 'all' || doc.program_level === filterLevel
    return matchSearch && matchLevel
  })

  // ═══════ FILE HANDLING ═══════
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.md'))
    setUploadFiles(prev => [...prev, ...files])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(f => f.name.endsWith('.md'))
      setUploadFiles(prev => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ═══════ UPLOAD ═══════
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return
    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const formData = new FormData()
    uploadFiles.forEach(f => formData.append('files', f))
    if (uploadLevel) formData.append('program_level', uploadLevel)
    if (uploadProgram) formData.append('program_name', uploadProgram)
    if (uploadYear) formData.append('academic_year', uploadYear)
    if (uploadReferenceUrl) formData.append('reference_url', uploadReferenceUrl)

    try {
      const res = await authFetch('/api/admin/ai-documents', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Lỗi upload')

      setUploadFiles([])
      setUploadLevel('')
      setUploadProgram('')
      setUploadYear('')
      setUploadReferenceUrl('')
      setUploadSuccess(`✅ Đã nạp thành công ${uploadFiles.length} file. Đang xử lý...`)
      loadData()
      setTimeout(() => setActiveTab('tasks'), 1500)
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  // ═══════ DELETE ═══════
  const handleDelete = async () => {
    if (!showDeleteConfirm) return
    setDeleting(true)
    try {
      await authFetch(`/api/admin/ai-documents?file_name=${encodeURIComponent(showDeleteConfirm)}`, {
        method: 'DELETE',
      })
      setShowDeleteConfirm(null)
      loadData()
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  // ═══════ EDIT DOCUMENT ═══════
  const openEditMarkdown = async (source: string) => {
    setEditSource(source)
    setEditLoading(true)
    setEditError('')
    setEditContent('')
    try {
      const res = await authFetch(`/api/admin/ai-documents/detail?source=${encodeURIComponent(source)}`).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Lỗi lấy dữ liệu')
      
      const chunks = res.data.chunks || []
      const parents = chunks.filter((c: any) => c.chunk_level === 'parent')
      let fullContent = ''
      if (parents.length > 0) {
        fullContent = parents.map((c: any) => c.content).join('\n\n')
      } else {
        const children = chunks.filter((c: any) => c.chunk_level === 'child')
        fullContent = children.map((c: any) => c.content).join('\n\n')
      }
      
      setEditContent(fullContent)
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) { setEditError('Nội dung không được rỗng.'); return; }
    setEditSaving(true)
    setEditError('')
    
    const blob = new Blob([editContent], { type: 'text/markdown' })
    const file = new File([blob], editSource || 'edit.md', { type: 'text/markdown' })
    
    const formData = new FormData()
    formData.append('files', file)
    
    // Preserve old metadata
    const currentDoc = vectorDocs.find(d => d.source === editSource)
    if (currentDoc) {
      if (currentDoc.program_level) formData.append('program_level', currentDoc.program_level)
      if (currentDoc.program_name) formData.append('program_name', currentDoc.program_name)
      if (currentDoc.academic_year) formData.append('academic_year', currentDoc.academic_year)
    }
    
    try {
      const res = await authFetch('/api/admin/ai-documents', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Lỗi lưu thay đổi')
      
      setEditSource(null)
      loadData()
      setActiveTab('tasks')
    } catch (err: any) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  // ═══════ DOCUMENT DETAIL ═══════
  const openDocDetail = async (source: string) => {
    setDetailSource(source)
    setDetailLoading(true)
    setDetailChunks([])
    setExpandedChunk(null)
    setDetailSearch('')
    try {
      const res = await authFetch(`/api/admin/ai-documents/detail?source=${encodeURIComponent(source)}`)
      const json = await res.json()
      if (json.success && json.data?.chunks) {
        setDetailChunks(json.data.chunks)
      }
    } catch (err) {
      console.error('Detail fetch error:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailSource(null)
    setDetailChunks([])
    setExpandedChunk(null)
    setDetailSearch('')
  }

  const filteredChunks = detailChunks.filter(c => {
    if (!detailSearch) return true
    const q = detailSearch.toLowerCase()
    return (
      c.content.toLowerCase().includes(q) ||
      (c.section_name && c.section_name.toLowerCase().includes(q)) ||
      (c.section_path && c.section_path.toLowerCase().includes(q))
    )
  })

  // ═══════ STATS ═══════
  const totalDocs = stats?.total_documents ?? vectorDocs.length
  const totalChunks = stats?.active_chunks ?? 0
  const hasEmbeddings = stats?.has_embeddings ?? 0
  const totalChars = stats?.total_characters ?? 0
  const dbConnected = stats?.db_status === 'connected'
  const processingTasks = tasks.filter(t => ['processing', 'queued', 'accepted', 'validating', 'chunking', 'embedding', 'inserting'].includes(t.status))

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">

      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#005496] to-[#0284c7] rounded-xl flex items-center justify-center shadow-lg shadow-[#005496]/20">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-800">Dữ liệu nguồn AI (Knowledge Base)</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <p className="text-[12px] text-slate-500 font-medium">Quản lý kho tri thức của Hệ thống AI Chatbot</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Đồng bộ
          </button>
          <button onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-[#005496] to-[#0068b8] rounded-lg hover:shadow-lg hover:shadow-[#005496]/20 transition-all active:scale-[0.98] shadow-md">
            <Upload size={13} /> Nạp tài liệu
          </button>
        </div>
      </div>

      {/* ═══════ STATS GRID ═══════ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Tài liệu', value: totalDocs, icon: FileText, color: 'text-[#005496]', bg: 'bg-[#005496]/5' },
          { label: 'Chunks hoạt động', value: totalChunks, icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Đoạn thông tin đã phân tích', value: hasEmbeddings, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Tổng ký tự', value: formatChars(totalChars), icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Đang xử lý', value: processingTasks.length, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
              <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={14} className={stat.color} />
              </div>
            </div>
            <div className="text-[22px] font-black text-slate-900 tracking-tight">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ═══════ LEVEL BREAKDOWN ═══════ */}
      {stats?.by_level && Object.keys(stats.by_level).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp size={12}/> Phân bổ theo bậc đào tạo
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(stats.by_level).map(([level, data]) => (
              <div key={level} className={`rounded-lg border p-3 ${LEVEL_COLORS[level] || LEVEL_COLORS.unknown}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap size={12}/>
                  <span className="text-[11px] font-bold uppercase tracking-wider">{LEVEL_MAP[level] || level}</span>
                </div>
                <div className="text-[17px] font-black">{data.chunks} <span className="text-[10px] font-bold opacity-70">chunks</span></div>
                <div className="text-[10px] font-semibold opacity-70">{data.documents} tài liệu</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ TABS ═══════ */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="flex items-center border-b border-slate-100 px-2 lg:px-4 bg-white">
          {[
            { key: 'vectordb', label: 'Tài liệu Hệ thống', icon: Database },
            { key: 'upload', label: 'Nạp File Mới', icon: Upload },
            { key: 'compose', label: 'Soạn nội dung', icon: PenLine },
            { key: 'tasks', label: 'Tasks Pipeline', icon: Clock, badge: processingTasks.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-bold transition-all relative ${
                activeTab === tab.key ? 'text-[#005496]' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <tab.icon size={14} /> {tab.label}
              {'badge' in tab && tab.badge! > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.key && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#005496] rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* ═══════ VECTORDB TAB ═══════ */}
        {activeTab === 'vectordb' && (
          <div>
            <div className="flex flex-col md:flex-row items-center gap-3 px-4 md:px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex-1 relative w-full md:max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm file hoặc ngành..."
                  className="w-full pl-9 pr-4 py-2 text-[12px] font-medium bg-white border border-slate-200 rounded-lg outline-none focus:border-[#005496] focus:ring-1 focus:ring-[#005496]/20 transition-all" />
              </div>
              <Select value={filterLevel} onValueChange={v => setFilterLevel(v)}>
                <SelectTrigger className="w-full md:w-[180px] h-9 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
                  <SelectValue placeholder="Tất cả bậc học" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md">
                  <SelectItem value="all">Tất cả bậc học</SelectItem>
                  <SelectItem value="thac_si">Thạc sĩ</SelectItem>
                  <SelectItem value="tien_si">Tiến sĩ</SelectItem>
                  <SelectItem value="dai_hoc">Đại học</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[11px] font-bold text-slate-400">{filteredDocs.length} kết quả</span>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-[12px] text-slate-700 text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="pl-5 pr-2 py-3 w-8"><CircleDot size={12} /></th>
                    <th className="px-3 py-3">Tên file nguồn</th>
                    <th className="px-3 py-3 hidden md:table-cell">Bậc / Ngành</th>
                    <th className="px-3 py-3 text-center">Chunks</th>
                    <th className="px-3 py-3 text-center hidden md:table-cell">Ký tự</th>
                    <th className="px-3 py-3 hidden lg:table-cell">Cập nhật lần cuối</th>
                    <th className="px-3 py-3 pr-5 text-right w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && vectorDocs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#005496]/40" /></td></tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <Database size={32} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-[13px] font-bold text-slate-500">Chưa có dữ liệu trong Hệ thống</p>
                      <p className="text-[11px] text-slate-400 mt-1">Nạp file Markdown để bắt đầu</p>
                    </td></tr>
                  ) : filteredDocs.map((doc, idx) => (
                    <tr key={doc.source + idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="pl-5 pr-2 py-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/40" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/80 text-slate-500 flex items-center justify-center shadow-sm">
                            <FileText size={13} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-[12px]">{doc.source}</p>
                            {doc.academic_year && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{doc.academic_year}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {doc.program_level ? (
                          <span className={`inline-flex gap-1 items-center px-2 py-0.5 rounded-md font-bold text-[10px] border ${LEVEL_COLORS[doc.program_level] || LEVEL_COLORS.unknown}`}>
                            <GraduationCap size={10} /> {LEVEL_MAP[doc.program_level] || doc.program_level}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                        {doc.program_name && <div className="mt-1 text-[11px] text-slate-500 font-semibold">{doc.program_name}</div>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-black text-[11px] border border-emerald-100">
                          <Layers size={10} /> {doc.chunk_count}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden md:table-cell">
                        <span className="text-[11px] font-bold text-slate-600">{formatChars(doc.total_chars)}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 hidden lg:table-cell text-[11px] font-medium">
                        {doc.updated_at ? format(new Date(doc.updated_at), 'HH:mm dd/MM/yyyy') : '—'}
                      </td>
                      <td className="px-3 pr-5 text-right w-24">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEditMarkdown(doc.source)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Sửa nội dung (Markdown)">
                            <PenLine size={14} />
                          </button>
                          <button onClick={() => openDocDetail(doc.source)}
                            className="p-1.5 text-slate-400 hover:text-[#005496] hover:bg-[#005496]/5 rounded-lg transition-all"
                            title="Xem chi tiết chunks">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => setShowDeleteConfirm(doc.source)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Xóa document">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════ UPLOAD TAB ═══════ */}
        {activeTab === 'upload' && (
          <div className="p-5 md:p-8 space-y-6">
            <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 md:p-12 text-center cursor-pointer hover:border-[#005496]/40 hover:bg-[#005496]/5 transition-all group">
              <input ref={fileInputRef} type="file" accept=".md" multiple onChange={handleFileSelect} className="hidden" />
              <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-md group-hover:border-[#005496]/20 transition-all">
                <Upload size={24} className="text-[#005496]" />
              </div>
              <p className="text-[14px] font-bold text-slate-800">Kéo thả file Markdown (.md) vào đây</p>
              <p className="text-[12px] font-medium text-slate-500 mt-1">File sẽ được xử lý và nạp vào hệ thống để AI có thể đọc hiểu</p>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 px-4 py-3 rounded-xl font-bold border border-red-100">
                <XCircle size={16} /> {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 text-[12px] text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl font-bold border border-emerald-100">
                <CheckCircle2 size={16} /> {uploadSuccess}
              </div>
            )}

            {uploadFiles.length > 0 && (
              <div className="space-y-2 max-w-2xl mx-auto border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
                  File đính kèm ({uploadFiles.length})
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {uploadFiles.map((f, i) => (
                    <div key={i} className="flex justify-between items-center bg-white px-3 py-2.5 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#005496]" />
                        <span className="text-[12px] font-semibold text-slate-700">{f.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200 max-w-2xl mx-auto">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cấp bậc đào tạo</label>
                <Select value={uploadLevel} onValueChange={v => setUploadLevel(v)}>
                  <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
                    <SelectValue placeholder="Tự động (Auto)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    <SelectItem value="auto">Tự động (Auto)</SelectItem>
                    <SelectItem value="thac_si">Thạc sĩ</SelectItem>
                    <SelectItem value="tien_si">Tiến sĩ</SelectItem>
                    <SelectItem value="dai_hoc">Đại học</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tên ngành</label>
                <input value={uploadProgram} onChange={e => setUploadProgram(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Ex: CNTT, Marketing..." />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Năm học</label>
                <input value={uploadYear} onChange={e => setUploadYear(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Ex: 2025-2026" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Link tham khảo (URL)</label>
                <input value={uploadReferenceUrl} onChange={e => setUploadReferenceUrl(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Ex: https://ufm.edu.vn/..." />
              </div>
            </div>

            <div className="flex justify-center mt-5">
              <button onClick={handleUpload} disabled={isUploading || uploadFiles.length === 0}
                className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#005496] to-[#0068b8] hover:shadow-lg hover:shadow-[#005496]/20 text-white font-bold text-[13px] shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]">
                {isUploading ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</> : <><Upload size={16} /> Bắt đầu nạp dữ liệu AI</>}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ COMPOSE TAB ═══════ */}
        {activeTab === 'compose' && (
          <div className="p-5 md:p-8 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
                <PenLine size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Soạn nội dung trực tiếp</h3>
                <p className="text-[11px] text-slate-500 font-medium">Soạn thảo nội dung trực tiếp để nạp vào hệ thống AI</p>
              </div>
            </div>

            {/* Alerts */}
            {composeError && (
              <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 px-4 py-3 rounded-xl font-bold border border-red-100">
                <XCircle size={16} /> {composeError}
              </div>
            )}
            {composeSuccess && (
              <div className="flex items-start gap-2 text-[12px] text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl font-bold border border-emerald-100">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p>{composeSuccess}</p>
                  {composePreview && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-emerald-600 hover:underline">Xem Markdown preview</summary>
                      <pre className="mt-2 p-3 bg-white rounded-lg border border-emerald-200 text-[11px] text-slate-700 whitespace-pre-wrap font-mono max-h-[200px] overflow-y-auto">{composePreview}</pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Title Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Tiêu đề văn bản <span className="text-red-400">*</span></label>
              <input
                value={composeTitle}
                onChange={e => setComposeTitle(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-800 outline-none focus:border-[#005496] focus:ring-2 focus:ring-[#005496]/10 transition-all placeholder:text-slate-400"
                placeholder="VD: Thông báo tuyển sinh Thạc sĩ đợt 2 năm 2026"
              />
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Nội dung soạn thảo <span className="text-red-400">*</span></label>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <RichTextEditor
                  content={composeContent}
                  onChange={setComposeContent}
                  minHeight={350}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid gap-4 md:grid-cols-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tên file (tùy chọn)</label>
                <input value={composeFileName} onChange={e => setComposeFileName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Tự tạo từ tiêu đề" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cấp bậc đào tạo</label>
                <Select value={composeLevel} onValueChange={v => setComposeLevel(v)}>
                  <SelectTrigger className="w-full h-9 rounded-lg border-slate-200 text-[12px] font-semibold bg-white">
                    <SelectValue placeholder="Tự động (Auto)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    <SelectItem value="auto">Tự động (Auto)</SelectItem>
                    <SelectItem value="thac_si">Thạc sĩ</SelectItem>
                    <SelectItem value="tien_si">Tiến sĩ</SelectItem>
                    <SelectItem value="dai_hoc">Đại học</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tên ngành</label>
                <input value={composeProgram} onChange={e => setComposeProgram(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Ex: Marketing, QTKD..." />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Năm học</label>
                <input value={composeYear} onChange={e => setComposeYear(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Ex: 2025-2026" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Link tham khảo (URL)</label>
                <input value={composeReferenceUrl} onChange={e => setComposeReferenceUrl(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#005496]"
                  placeholder="Ex: https://ufm.edu.vn/..." />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Sparkles size={13} className="text-violet-400" />
                <span>Gemini AI sẽ chuyển đổi nội dung sang Markdown tự động</span>
              </div>
              <button
                onClick={async () => {
                  if (!composeTitle.trim() || !composeContent.trim()) {
                    setComposeError('Vui lòng nhập tiêu đề và nội dung.')
                    return
                  }
                  setIsComposing(true)
                  setComposeError('')
                  setComposeSuccess('')
                  setComposePreview('')
                  try {
                    const res = await fetch('/api/admin/ai-documents/compose', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: composeTitle.trim(),
                        html_content: composeContent,
                        file_name: composeFileName.trim(),
                        program_level: composeLevel || undefined,
                        program_name: composeProgram.trim() || undefined,
                        academic_year: composeYear.trim() || undefined,
                        reference_url: composeReferenceUrl.trim() || undefined,
                      }),
                    })
                    const json = await res.json()
                    if (!json.success) throw new Error(json.error || 'Lỗi xử lý')

                    setComposeSuccess(`✅ Đã chuyển đổi thành công → ${json.data.file_name} (${json.data.markdown_length} ký tự). Đang nạp vào Hệ thống AI...`)
                    setComposePreview(json.data.markdown_preview || '')
                    setComposeTitle('')
                    setComposeContent('')
                    setComposeFileName('')
                    setComposeLevel('')
                    setComposeProgram('')
                    setComposeYear('')
                    loadData()
                    setTimeout(() => setActiveTab('tasks'), 2500)
                  } catch (err: any) {
                    setComposeError(err.message)
                  } finally {
                    setIsComposing(false)
                  }
                }}
                disabled={isComposing || !composeTitle.trim() || !composeContent.trim()}
                className="h-10 px-8 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg hover:shadow-violet-200 text-white font-bold text-[13px] shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isComposing ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang chuyển đổi...</>
                ) : (
                  <><Sparkles size={16} /> Nạp dữ liệu vào AI</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════ TASKS TAB ═══════ */}
        {activeTab === 'tasks' && (
          <div className="p-0 min-h-[300px]">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <Server size={32} className="text-slate-200 mb-3" />
                <p className="font-bold text-[14px] text-slate-600">Chưa có task nào từ FastAPI</p>
                <p className="text-[12px] mt-1 text-slate-400">Tiến trình ingestion sẽ hiển thị ở đây</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map(t => {
                  const isDone = t.status === 'done' || t.status === 'completed'
                  const isErr = t.status === 'error' || t.status === 'failed'
                  const isCancelled = t.status === 'cancelled'
                  const isProc = !isDone && !isErr && !isCancelled
                  return (
                    <div key={t.task_id} className="p-4 md:px-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        isDone ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' :
                        isCancelled ? 'bg-orange-50 text-orange-500 shadow-orange-100' :
                        isErr ? 'bg-red-50 text-red-600 shadow-red-100' :
                        'bg-blue-50 text-blue-600 shadow-blue-100'
                      }`}>
                        {isDone ? <CheckCircle2 size={18}/> : isCancelled ? <Ban size={18}/> : isErr ? <XCircle size={18}/> : <Loader2 size={18} className="animate-spin"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-800 tracking-tight">
                          Task <span className="font-mono text-[11px] text-slate-500">{t.task_id.substring(0, 8)}...</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isDone ? 'bg-emerald-50 text-emerald-600' :
                            isCancelled ? 'bg-orange-50 text-orange-500' :
                            isErr ? 'bg-red-50 text-red-500' :
                            'bg-blue-50 text-blue-600'
                          }`}>{t.status}</span>
                          {t.created_at && <span className="text-[10px] text-slate-400 font-medium">• {format(new Date(t.created_at), 'HH:mm dd/MM')}</span>}
                          {t.reason && <span className="text-[10px] text-red-500 font-bold truncate max-w-[200px]">• {t.reason}</span>}
                        </div>
                      </div>
                      {isProc && t.progress !== undefined && (
                        <div className="w-24 md:w-32 flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full border border-slate-200 overflow-hidden bg-slate-100">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all rounded-full" style={{width: `${Math.max(t.progress, 5)}%`}} />
                          </div>
                          <span className="text-[10px] font-black text-slate-600">{t.progress}%</span>
                        </div>
                      )}
                      {isDone && t.result?.total_chunks && (
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg hidden md:block">
                          {t.result.total_chunks} chunks ✓
                        </span>
                      )}
                      {isProc && (
                        <button
                          onClick={async () => {
                            try {
                              await fetch('/api/admin/ai-documents/tasks', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ task_id: t.task_id }),
                              })
                              // Refresh tasks after cancel
                              const taskRes = await fetch('/api/admin/ai-documents/tasks').then(r => r.json())
                              if (taskRes.success && taskRes.data) setTasks(taskRes.data)
                            } catch (err) {
                              console.error('Cancel error:', err)
                            }
                          }}
                          className="px-3 py-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all flex items-center gap-1 shrink-0"
                          title="Hủy task"
                        >
                          <Ban size={12} /> Hủy
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════ DOCUMENT DETAIL MODAL ═══════ */}
      {detailSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeDetail}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#005496] to-[#0284c7] rounded-xl flex items-center justify-center shadow-md shadow-[#005496]/20">
                  <FileText size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-slate-800 truncate">{detailSource}</h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {detailLoading ? 'Đang tải...' : `${detailChunks.length} chunks • ${filteredChunks.length} hiển thị`}
                  </p>
                </div>
              </div>
              <button onClick={closeDetail} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Search bar */}
            {!detailLoading && detailChunks.length > 0 && (
              <div className="px-6 py-3 border-b border-slate-100 bg-white shrink-0">
                <div className="relative max-w-md">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={detailSearch}
                    onChange={e => setDetailSearch(e.target.value)}
                    placeholder="Tìm nội dung trong chunks..."
                    className="w-full pl-9 pr-4 py-2 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#005496] focus:ring-1 focus:ring-[#005496]/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Chunk list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#005496]/40 mb-3" />
                  <p className="text-[12px] text-slate-500 font-medium">Đang tải chi tiết chunks...</p>
                </div>
              ) : filteredChunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Database size={32} className="text-slate-200 mb-3" />
                  <p className="text-[13px] font-bold text-slate-500">
                    {detailSearch ? 'Không tìm thấy chunk nào khớp' : 'Không có chunks trong document này'}
                  </p>
                </div>
              ) : (
                filteredChunks.map((chunk, idx) => {
                  const isExpanded = expandedChunk === chunk.chunk_id
                  const isParent = chunk.chunk_level === 'parent'
                  return (
                    <div key={chunk.chunk_id} className={`border rounded-xl overflow-hidden transition-all ${
                      isParent
                        ? 'border-[#005496]/20 bg-[#005496]/[0.02]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                      {/* Chunk header */}
                      <button
                        onClick={() => setExpandedChunk(isExpanded ? null : chunk.chunk_id)}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-black text-slate-400 w-6">#{idx + 1}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isParent
                              ? 'bg-[#005496]/10 text-[#005496]'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {chunk.chunk_level || 'child'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {chunk.section_path && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mb-0.5 truncate">
                              <FolderTree size={10} className="shrink-0" />
                              <span className="truncate">{chunk.section_path}</span>
                            </div>
                          )}
                          <p className="text-[11px] font-semibold text-slate-700 line-clamp-2">
                            {chunk.section_name || chunk.content_preview.substring(0, 120) + '...'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {chunk.char_count} ký tự
                          </span>
                          <ChevronRight size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Metadata badges */}
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <Hash size={9} /> {chunk.chunk_id.substring(0, 12)}...
                            </span>
                            {chunk.parent_id && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                                Parent: {chunk.parent_id.substring(0, 12)}...
                              </span>
                            )}
                            {chunk.program_level && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border ${LEVEL_COLORS[chunk.program_level] || LEVEL_COLORS.unknown}`}>
                                <GraduationCap size={9} /> {LEVEL_MAP[chunk.program_level] || chunk.program_level}
                              </span>
                            )}
                            {chunk.program_name && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {chunk.program_name}
                              </span>
                            )}
                            {chunk.ma_nganh && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                Mã: {chunk.ma_nganh}
                              </span>
                            )}
                            {chunk.academic_year && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {chunk.academic_year}
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="bg-slate-50 rounded-lg border border-slate-200/80 p-4">
                            <pre className="text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-[400px] overflow-y-auto">
                              {chunk.content}
                            </pre>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>{chunk.char_count} ký tự • {chunk.chunk_level}</span>
                            {chunk.created_at && <span>Tạo lúc: {format(new Date(chunk.created_at), 'HH:mm dd/MM/yyyy')}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                {detailChunks.filter(c => c.chunk_level === 'parent').length} parent • {detailChunks.filter(c => c.chunk_level !== 'parent').length} child chunks
              </span>
              <button onClick={closeDetail} className="px-4 py-2 text-[12px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE MODAL ═══════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 w-full animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-800 text-center">Xóa tài liệu khỏi hệ thống?</h3>
            <p className="text-[12px] text-slate-500 text-center mt-2 font-medium">
              Tài liệu <span className="font-bold text-slate-700">{showDeleteConfirm}</span> sẽ bị vô hiệu hoá và AI sẽ không thể đọc được nữa.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-[13px] font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Hủy</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 text-[13px] font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <><Loader2 size={14} className="animate-spin"/> Đang xóa...</> : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ EDIT MODAL ═══════ */}
      {editSource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in transition-all">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <PenLine size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                    Sửa nội dung Markdown trực tiếp
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium">Tài liệu: {editSource}</p>
                </div>
              </div>
              <button disabled={editSaving} onClick={() => setEditSource(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-auto bg-[#f8fafc]">
              {editError && (
                <div className="mb-4 text-[12px] font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  ⚠️ {editError}
                </div>
              )}
              {editLoading ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 gap-3">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-[13px] font-medium">Đang lấy cấu trúc nội dung từ hệ thống AI...</p>
                </div>
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[400px] p-4 bg-white border border-slate-200 rounded-xl shadow-inner font-mono text-[13px] leading-relaxed text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
                  placeholder="Nội dung Markdown..."
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
              <p className="text-[11px] text-slate-500 font-medium">Lưu thay đổi sẽ tự động xoá chunk cũ và chạy lại pipeline cắt văn bản.</p>
              <div className="flex gap-3">
                <button disabled={editSaving} onClick={() => setEditSource(null)} className="px-5 py-2 text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
                  Hủy
                </button>
                <button disabled={editSaving || editLoading} onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2 text-[13px] font-bold text-white bg-gradient-to-r from-[#005496] to-[#0068b8] hover:shadow-lg rounded-xl transition-all disabled:opacity-50">
                  {editSaving ? <><Loader2 size={16} className="animate-spin" /> Đang Re-Ingest...</> : <><Sparkles size={16} /> Cập nhật & Nạp lại</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
