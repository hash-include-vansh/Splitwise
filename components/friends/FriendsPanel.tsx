'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, X, Loader2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getFriends, removeFriend } from '@/lib/services/friends-client'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/lib/types'

interface FriendsPanelProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onSelectFriend?: (friend: User) => void
  selectionMode?: boolean
}

export function FriendsPanel({ 
  isOpen, 
  onClose, 
  currentUserId,
  onSelectFriend,
  selectionMode = false
}: FriendsPanelProps) {
  const [friends, setFriends] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
    }
  }, [isOpen, currentUserId])

  async function fetchFriends() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await getFriends(currentUserId)
      if (error) throw error
      setFriends(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveFriend(friendId: string) {
    setRemovingId(friendId)
    try {
      const { error } = await removeFriend(currentUserId, friendId)
      if (error) throw error
      setFriends(friends.filter(f => f.id !== friendId))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  const filteredFriends = friends.filter(friend => {
    const query = searchQuery.toLowerCase()
    return (
      friend.name?.toLowerCase().includes(query) ||
      friend.email?.toLowerCase().includes(query)
    )
  })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {selectionMode ? 'Select Friend' : 'My Friends'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && filteredFriends.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No friends match your search' : 'No friends yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Add friends from group member lists
              </p>
            </div>
          )}

          {!loading && !error && filteredFriends.length > 0 && (
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className={`flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all ${
                    selectionMode ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (selectionMode && onSelectFriend) {
                      onSelectFriend(friend)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={friend.avatar_url}
                      alt={friend.name || 'User'}
                      name={friend.name}
                      email={friend.email}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {friend.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {friend.email}
                      </p>
                    </div>
                  </div>

                  {!selectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFriend(friend.id)
                      }}
                      disabled={removingId === friend.id}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Remove friend"
                    >
                      {removingId === friend.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {friends.length} friend{friends.length !== 1 ? 's' : ''} in your list
          </p>
        </div>
      </div>
    </>
  )
}

