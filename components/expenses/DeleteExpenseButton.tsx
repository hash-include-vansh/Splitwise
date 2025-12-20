'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteExpenseButtonProps {
  expenseId: string
  groupId: string
}

export function DeleteExpenseButton({ expenseId, groupId }: DeleteExpenseButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Delete expense (cascade will delete splits)
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) {
        console.error('Error deleting expense:', error)
        alert('Failed to delete expense: ' + error.message)
        setLoading(false)
        return
      }

      // Redirect to expenses list
      router.push(`/groups/${groupId}/expenses`)
      router.refresh()
    } catch (err: any) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Delete Expense
    </button>
  )
}

