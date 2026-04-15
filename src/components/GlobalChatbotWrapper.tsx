'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Chatbot from './Chatbot'

export default function GlobalChatbotWrapper() {
  const pathname = usePathname()

  // Không hiển thị Chatbot ở các trang quản trị (Admin) và trang Chat Toàn Màn Hình
  if (pathname.startsWith('/admin') || pathname.startsWith('/chat/create')) {
    return null
  }

  return <Chatbot />
}
