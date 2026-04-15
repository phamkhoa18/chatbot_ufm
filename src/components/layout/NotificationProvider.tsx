'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  description: string
  time: string
  read: boolean
  href: string
  icon: string
  color: string
}

interface NotificationContextType {
  notifications: Notification[]
  badges: Record<string, number>
  unreadCount: number
  loading: boolean
  refresh: () => void
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  badges: {},
  unreadCount: 0,
  loading: true,
  refresh: () => {},
  markAllRead: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data.notifications)
        setBadges(json.data.badges)
        setUnreadCount(json.data.unreadCount)
      }
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ notifications, badges, unreadCount, loading, refresh: fetchNotifications, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
