'use client'

import { useState } from 'react'
import { useSendReminder } from '@/hooks/usePayments'
import { toast } from 'react-toastify'
import { Bell } from 'lucide-react'

interface RemindButtonProps {
  groupId: string
  debtorId: string
  creditorId: string
  amount: number
}

export function RemindButton({ groupId, debtorId, creditorId, amount }: RemindButtonProps) {
  const [cooldown, setCooldown] = useState(false)
  const sendReminder = useSendReminder()

  const handleRemind = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (cooldown || sendReminder.isPending) return

    try {
      await sendReminder.mutateAsync({ groupId, debtorId, creditorId, amount })
      toast.success('Reminder sent!', {
        position: 'top-right',
        autoClose: 2000,
      })
      setCooldown(true)
      // Disable for 24 hours
      setTimeout(() => setCooldown(false), 24 * 60 * 60 * 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reminder', {
        position: 'top-right',
        autoClose: 3000,
      })
    }
  }

  return (
    <button
      onClick={handleRemind}
      disabled={cooldown || sendReminder.isPending}
      title={cooldown ? 'Reminder already sent' : 'Send payment reminder'}
      className={`rounded-lg p-1.5 transition-all ${
        cooldown
          ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
          : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 active:scale-95'
      }`}
    >
      <Bell className={`h-4 w-4 ${sendReminder.isPending ? 'animate-pulse' : ''}`} />
    </button>
  )
}
