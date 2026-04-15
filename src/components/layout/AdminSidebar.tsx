'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { useNotifications } from './NotificationProvider'

type NavItemType = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  children?: { label: string; href: string; permission?: string }[];
};

const ADMIN_NAV: NavItemType[] = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Lịch sử trò chuyện', href: '/admin/lich-su-chat', icon: 'MessageSquare' },
  { label: 'Khách hàng tiềm năng', href: '/admin/khach-hang-tiem-nang', icon: 'Users' },
  { label: 'Kiểm soát dữ liệu AI', href: '/admin/ai-chatbot', icon: 'Database' },
  { label: 'Cài đặt hệ thống', href: '/admin/cai-dat', icon: 'Settings' },
]

interface AdminSidebarProps {
  userRole?: string
  onCloseMobile?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const Icon = ({ name, ...rest }: { name: string; [key: string]: any }) => {
  const LucideIcon = (Icons as any)[name]
  if (!LucideIcon) return <Icons.Circle {...rest} />
  return <LucideIcon {...rest} />
}

export default function AdminSidebar({ userRole, onCloseMobile, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const { badges } = useNotifications()

  const getBadgeCount = (href: string) => badges[href] || 0

  // Bỏ logic filter quyền vì bot k dùng
  const filteredNav = ADMIN_NAV;

  const toggleDropdown = (label: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <div className="bg-white text-slate-600 h-full flex flex-col font-sans border-r border-slate-200 overflow-hidden">
      
      {/* Mobile Close Button */}
      <div className="absolute top-4 right-4 lg:hidden z-10">
        <button onClick={onCloseMobile} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full">
          <Icons.X className="w-5 h-5" />
        </button>
      </div>

      {/* Logo Area */}
      <div className={`h-16 flex items-center border-b border-slate-100 bg-white shrink-0 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
        <Link href="/admin/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 group transition-opacity w-full">
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <Image 
              src="/images/logo_ufm_50nam_no_bg.png" 
              alt="UFM Logo" 
              width={36} 
              height={36} 
              className="object-contain"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-slate-800 font-bold text-sm tracking-tight leading-tight">UFM Admin</span>
              <span className="text-[#005496] font-semibold text-[0.6rem] uppercase tracking-wider leading-tight">Dashboard</span>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Menu */}
      <div className={`flex-1 overflow-y-auto py-3 space-y-0.5 custom-scrollbar ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {filteredNav.map((item) => {
           const isActive = pathname === item.href || (item.children && item.children.some(c => pathname.startsWith(c.href)))
           const isOpen = openDropdowns[item.label] || isActive

          return (
            <div key={item.label}>
              {item.children && !isCollapsed ? (
                // Dropdown (chỉ hiện khi sidebar mở rộng)
                <div>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group text-[14px] ${
                      isActive 
                        ? 'bg-[#005496]/5 text-[#005496]' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#005496]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon 
                        name={item.icon} 
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#005496]' : 'text-slate-400 group-hover:text-[#005496]/80'
                        }`} 
                      />
                      <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getBadgeCount(item.href) > 0 && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-rose-500 text-white rounded-full leading-none animate-in zoom-in duration-300">
                          {getBadgeCount(item.href)}
                        </span>
                      )}
                    </div>
                    <Icons.ChevronDown 
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#005496]' : 'text-slate-400 group-hover:text-[#005496]/80'
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-1 pb-1 ml-[1rem] space-y-0.5 border-l border-slate-200 pl-3 mt-0.5 relative">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href
                            return (
                              <Link
                                key={child.label}
                                href={child.href}
                                onClick={handleLinkClick}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-[13px] font-medium relative ${
                                  isChildActive 
                                    ? 'bg-[#005496]/10 text-[#005496] font-semibold' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                              >
                                {isChildActive && (
                                  <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-[2.5px] h-3.5 bg-[#ffd200] rounded-r-md" />
                                )}
                                <span>{child.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                // Menu đơn (hoặc collapsed mode)
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 rounded-lg transition-all group text-[14px] relative ${
                    isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                  } ${
                    isActive 
                      ? 'bg-[#005496]/5 text-[#005496]' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#005496]'
                  }`}
                >
                  <Icon 
                    name={item.icon} 
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#005496]' : 'text-slate-400 group-hover:text-[#005496]/80'
                    }`} 
                  />
                  {!isCollapsed && (
                    <span className={`flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#005496] text-white rounded-md leading-none">{item.badge}</span>
                  )}
                  {!isCollapsed && getBadgeCount(item.href) > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-rose-500 text-white rounded-full leading-none animate-in zoom-in duration-300">
                      {getBadgeCount(item.href)}
                    </span>
                  )}
                  {isCollapsed && getBadgeCount(item.href) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center px-0.5 text-[8px] font-bold bg-rose-500 text-white rounded-full leading-none">
                      {getBadgeCount(item.href)}
                    </span>
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Toggle Collapse Button (Desktop only) */}
      <div className={`hidden lg:flex items-center border-t border-slate-100 ${isCollapsed ? 'justify-center p-2' : 'px-3 py-3'}`}>
        <button 
          onClick={onToggleCollapse}
          className={`flex items-center gap-2.5 text-[13px] font-medium text-slate-500 hover:text-[#005496] hover:bg-slate-50 rounded-lg transition-all ${
            isCollapsed ? 'p-2.5' : 'px-3 py-2 w-full'
          }`}
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? (
            <Icons.PanelLeftOpen className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <Icons.PanelLeftClose className="w-4 h-4 shrink-0" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
