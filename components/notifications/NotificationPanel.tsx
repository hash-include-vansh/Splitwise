'use client'

import { useState, useEffect } from 'react'
import { X, Bell, Check, CheckCheck, Loader2 } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '@/lib/services/notifications-client'
import type { Notification } from '@/lib/types'
import Link from 'next/link'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function NotificationPanel({ isOpen, onClose, userId }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, userId])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await getNotifications(userId, 30)
    setNotifications(data || [])
    setLoading(false)
  }

  async function handleMarkAsRead(notificationId: string) {
    await markAsRead(notificationId)
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true)
    await markAllAsRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setMarkingAll(false)
  }

  function getNotificationLink(notification: Notification): string | null {
    const metadata = notification.metadata as any
    
    switch (notification.type) {
      case 'group_created':
      case 'group_joined':
        return metadata?.groupId ? `/groups/${metadata.groupId}` : null
      case 'expense_added':
        return metadata?.groupId ? `/groups/${metadata.groupId}` : null
      case 'payment_pending':
      case 'payment_accepted':
      case 'payment_rejected':
        return metadata?.groupId ? `/groups/${metadata.groupId}/balances` : null
      default:
        return null
    }
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case 'group_created':
        return '🎉'
      case 'group_joined':
        return '👋'
      case 'expense_added':
        return '💰'
      case 'payment_pending':
        return '⏳'
      case 'payment_accepted':
        return '✅'
      case 'payment_rejected':
        return '❌'
      case 'friend_added':
        return '🤝'
      case 'group_settled':
        return '🎊'
      default:
        return '📢'
    }
  }

  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col" style={{ height: '100vh', minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-12 px-6">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                You&apos;ll see updates about payments, expenses, and groups here
              </p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification)
                const icon = getNotificationIcon(notification.type)
                
                const content = (
                  <div
                    className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )

                if (link) {
                  return (
                    <Link key={notification.id} href={link} onClick={onClose}>
                      {content}
                    </Link>
                  )
                }

                return <div key={notification.id}>{content}</div>
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

