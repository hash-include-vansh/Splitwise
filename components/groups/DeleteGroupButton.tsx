'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteGroupButtonProps {
  groupId: string
  groupName: string
}

export function DeleteGroupButton({ groupId, groupName }: DeleteGroupButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to delete a group')
        setLoading(false)
        return
      }

      const { data: member } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (!member || member.role !== 'admin') {
        alert('Only group admins can delete groups')
        setLoading(false)
        return
      }

      // Delete group (cascade will delete expenses, splits, members, invites)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) {
        console.error('Error deleting group:', error)
        alert('Failed to delete group: ' + error.message)
        setLoading(false)
        return
      }

      // Redirect to groups list
      router.push('/groups')
      router.refresh()
    } catch (err: any) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-900">
          Are you sure you want to delete &quot;{groupName}&quot;?
        </p>
        <p className="text-xs text-red-700">
          This will permanently delete the group and all its expenses. This action cannot be undone.
        </p>
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
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Delete Group
    </button>
  )
}

