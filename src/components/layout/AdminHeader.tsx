'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Menu, Search, Bell, Settings, LogOut, Loader2, X, AlertCircle, ArrowUpRight, MessageSquare, PanelLeft, PanelLeftClose, PanelLeftOpen, Bot, User, UserPlus, FileText, CheckCheck, ExternalLink, Clock, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipTrigger, TooltipContent } from '@radix-ui/react-tooltip'
import { useNotifications } from './NotificationProvider'
import { useRouter } from 'next/navigation'

interface AdminHeaderProps {
  user?: any
  onMenuClick?: () => void
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

const ICON_MAP: Record<string, any> = {
  UserPlus, FileText, Bell, GraduationCap
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-[#005496]/10 text-[#005496]',
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-emerald-100 text-emerald-600',
  red: 'bg-rose-100 text-rose-600',
}

export default function AdminHeader({ user, onMenuClick, onToggleSidebar, isSidebarCollapsed }: AdminHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const { notifications, unreadCount, loading, markAllRead } = useNotifications()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/admin/khach-hang-tiem-nang?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="h-[60px] bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-10 transition-colors shrink-0">
      <div className="flex-1 flex items-center gap-2">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-slate-400 hover:text-[#005496] rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5 flex-shrink-0" />
        </button>

        {/* Desktop sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-2 text-slate-400 hover:text-[#005496] rounded-lg hover:bg-[#005496]/5 transition-colors focus:outline-none"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-[18px] h-[18px]" />
              ) : (
                <PanelLeftClose className="w-[18px] h-[18px]" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          </TooltipContent>
        </Tooltip>

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 focus-within:ring-1 focus-within:ring-[#005496]/50 focus-within:border-[#005496] transition-all w-72 ml-1">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="bg-transparent border-none outline-none text-[14px] text-slate-700 w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* ═══════════════════════════════════
           NOTIFICATION BELL + PANEL
           ═══════════════════════════════════ */}
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false) }}
                className="p-1.5 text-slate-400 hover:text-[#005496] hover:bg-[#005496]/5 rounded-lg transition-colors relative"
              >
                <Bell className="w-[1.1rem] h-[1.1rem]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[9px] font-bold bg-rose-500 text-white rounded-full leading-none border-2 border-white animate-in zoom-in duration-200">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Thông báo</TooltipContent>
          </Tooltip>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {isNotifOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-20"
                  onClick={() => setIsNotifOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-[380px] bg-white rounded-xl border border-slate-200 overflow-hidden z-30 shadow-xl"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-slate-800">Thông báo</h3>
                      {unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-rose-500 text-white rounded-full leading-none">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#005496] hover:text-[#004377] transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Đã xem tất cả
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-[#005496]/20 border-t-[#005496] rounded-full animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-700">Không có thông báo mới</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Hệ thống sẽ cập nhật tự động.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(notif => {
                          const IconComp = ICON_MAP[notif.icon] || Bell
                          const colorClass = COLOR_MAP[notif.color] || COLOR_MAP.blue
                          return (
                            <Link
                              key={notif.id}
                              href={notif.href}
                              onClick={() => setIsNotifOpen(false)}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group ${
                                !notif.read ? 'bg-[#005496]/[0.02]' : ''
                              }`}
                            >
                              {/* Icon */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                                <IconComp className="w-4 h-4" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-[13px] leading-snug ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 bg-[#005496] rounded-full shrink-0 mt-1.5" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{notif.description}</p>
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {timeAgo(notif.time)}
                                </p>
                              </div>

                              {/* Hover arrow */}
                              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#005496] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setIsNotifOpen(false)}
                        className="text-[12px] font-semibold text-[#005496] hover:text-[#004377] transition-colors flex items-center justify-center gap-1"
                      >
                        Xem tất cả hoạt động <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[1px] h-5 bg-slate-200"></div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false) }}
            className="flex items-center gap-2.5 focus:outline-none p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="text-right hidden sm:block pr-0.5">
              <p className="text-[14px] font-semibold text-slate-700 leading-tight">{user?.name || 'Nguyễn Văn A'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider leading-tight">{user?.role || 'Admin'}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#005496]/10 flex items-center justify-center border border-[#005496]/20 relative overflow-hidden">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.name} fill className="object-cover" />
              ) : (
                <span className="text-[#005496] font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-20"
                  onClick={() => setIsProfileOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-100 overflow-hidden z-30 ring-1 ring-slate-900/5"
                >
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg bg-[#005496]/10 text-[#005496] flex items-center justify-center font-bold text-xs">
                       {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                     </div>
                     <div className="flex flex-col min-w-0">
                       <p className="text-[14px] font-bold text-slate-800 tracking-tight truncate">{user?.name || 'User Name'}</p>
                       <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
                     </div>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link 
                      href="/admin/ho-so"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[14px] font-medium text-slate-600 hover:text-[#005496] hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" /> Hồ sơ cá nhân
                    </Link>
                    <button className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[14px] font-medium text-slate-600 hover:text-[#005496] hover:bg-slate-50 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" /> Cài đặt
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={async () => {
                         try {
                           await fetch('/api/auth/logout', { method: 'POST' });
                           window.location.href = '/login';
                         } catch (e) {
                           console.error(e);
                         }
                      }}
                      className="flex w-full items-center gap-2.5 px-2.5 py-2 text-[14px] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-semibold"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
