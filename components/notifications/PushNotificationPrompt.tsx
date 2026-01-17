'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)

    // Show prompt if permission hasn't been decided yet
    if (Notification.permission === 'default') {
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('push-notification-prompt-dismissed')
      if (!dismissed) {
        // Wait a bit before showing the prompt
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 5000) // Show after 5 seconds

        return () => clearTimeout(timer)
      }
    }
  }, [])

  async function requestPermission() {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShowPrompt(false)

      if (result === 'granted') {
        // Register for push notifications
        const registration = await navigator.serviceWorker.ready
        
        // You would typically send the subscription to your server here
        // For now, we just show a confirmation
        new Notification('Notifications Enabled', {
          body: 'You will now receive updates about payments and expenses.',
          icon: '/icon-192.png',
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  function dismissPrompt() {
    setShowPrompt(false)
    localStorage.setItem('push-notification-prompt-dismissed', 'true')
  }

  if (!showPrompt || permission !== 'default') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="rounded-2xl bg-white shadow-xl border border-gray-200 p-4 flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="h-6 w-6 text-gray-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 mb-1">Enable Notifications</h4>
          <p className="text-sm text-gray-600 mb-3">
            Get notified when someone adds an expense or confirms a payment.
          </p>
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={dismissPrompt}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={dismissPrompt}
          className="flex-shrink-0 self-start p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

