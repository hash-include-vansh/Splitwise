'use client'

import { useState } from 'react'
import { createGroup } from '@/lib/services/groups-client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to create a group')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: groupError } = await createGroup(name, user.id)
      if (groupError) {
        console.error('Group creation error:', groupError)
        setError(groupError.message || 'Failed to create group')
        setLoading(false)
        return
      }
      if (!data) {
        setError('Failed to create group')
        setLoading(false)
        return
      }
      router.push(`/groups/${data.id}`)
      router.refresh()
      onClose()
      setName('')
    } catch (err: any) {
      console.error('Unexpected error creating group:', err)
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Roommates, Trip to Europe"
            />
          </div>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

