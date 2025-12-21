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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-8 shadow-xl border border-gray-200/60">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Create New Group
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 sm:mb-6">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Group Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl sm:rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all"
              placeholder="e.g., Weekend Squad, Bali Trip..."
            />
          </div>
          {error && (
            <div className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 p-3 sm:p-4 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}
          <div className="flex gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl sm:rounded-2xl border border-gray-300 bg-white px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-xl sm:rounded-2xl bg-black px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-elegant hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

