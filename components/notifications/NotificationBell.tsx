'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { getUnreadCount } from '@/lib/services/notifications-client'
import { NotificationPanel } from './NotificationPanel'

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId: initialUserId }: NotificationBellProps) {
  const [userId, setUserId] = useState<string | null>(initialUserId || null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    // If no userId provided, fetch from API
    async function fetchUser() {
      if (!initialUserId) {
        try {
          const response = await fetch('/api/user')
          const data = await response.json()
          if (data.user?.id) {
            setUserId(data.user.id)
          }
        } catch (err) {
          console.error('Failed to fetch user for notifications:', err)
        }
      }
    }
    fetchUser()
  }, [initialUserId])

  useEffect(() => {
    if (!userId) return
    
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [userId])

  async function fetchUnreadCount() {
    if (!userId) return
    const { count } = await getUnreadCount(userId)
    setUnreadCount(count)
  }
  
  // Don't render if no user
  if (!userId) return null

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={showPanel}
        onClose={() => {
          setShowPanel(false)
          fetchUnreadCount()
        }}
        userId={userId}
      />
    </>
  )
}

