'use client'

import React, { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { NotificationProvider } from './NotificationProvider'

interface AdminShellProps {
  user?: any
  children: React.ReactNode
}

export default function AdminShell({ user = { name: 'Admin', role: 'ADMIN' }, children }: AdminShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  return (
    <NotificationProvider>
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-[#f8f9fb] text-slate-900 font-sans selection:bg-[#005496]/20 selection:text-[#005496]">
        
        {/* Overlay cho Mobile */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar — cố định bên trái */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
        `}>
          <AdminSidebar 
            userRole={user.role} 
            onCloseMobile={() => setIsMobileOpen(false)} 
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </aside>

        {/* Cột phải: Header sticky + Main scrollable */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader 
            user={user} 
            onMenuClick={() => setIsMobileOpen(true)} 
            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
            isSidebarCollapsed={isCollapsed}
          />
          <main className="flex-1 overflow-y-auto p-6 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
    </NotificationProvider>
  )
}
