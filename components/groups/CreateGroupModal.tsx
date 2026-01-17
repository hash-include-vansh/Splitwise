'use client'

import { useState, useEffect, useMemo } from 'react'
import { createGroup } from '@/lib/services/groups-client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@supabase/supabase-js'
import type { User as AppUser } from '@/lib/types'
import { getFriends } from '@/lib/services/friends-client'
import { Avatar } from '@/components/ui/Avatar'
import { Users, X, ChevronDown, ChevronUp, Search } from 'lucide-react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  initialUser?: User | null
}

export function CreateGroupModal({ isOpen, onClose, initialUser }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friends, setFriends] = useState<AppUser[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [showFriendSelector, setShowFriendSelector] = useState(false)
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [friendSearchQuery, setFriendSearchQuery] = useState('')
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  
  // Use initialUser from server if available, otherwise use authUser from hook
  const user = initialUser || authUser

  useEffect(() => {
    if (isOpen && user) {
      loadFriends()
    }
  }, [isOpen, user])

  async function loadFriends() {
    if (!user) return
    setLoadingFriends(true)
    try {
      const { data } = await getFriends(user.id)
      setFriends(data || [])
    } catch (err) {
      console.error('Error loading friends:', err)
    } finally {
      setLoadingFriends(false)
    }
  }

  function toggleFriend(friendId: string) {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  // Filter friends by search query
  const filteredFriends = useMemo(() => {
    if (!friendSearchQuery.trim()) return friends
    const query = friendSearchQuery.toLowerCase()
    return friends.filter(f => 
      f.name?.toLowerCase().includes(query) || 
      f.email?.toLowerCase().includes(query)
    )
  }, [friends, friendSearchQuery])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('CreateGroupModal: Submitting form, user:', user?.id || 'null', 'authLoading:', authLoading, 'initialUser:', initialUser?.id || 'null')
    
    // Wait for auth to finish loading (unless we have initialUser)
    if (authLoading && !initialUser) {
      setError('Please wait while we verify your authentication...')
      return
    }
    
    if (!user) {
      console.log('CreateGroupModal: No user found')
      setError('You must be logged in to create a group')
      return
    }
    
    console.log('CreateGroupModal: Creating group with user:', user.id)

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

      // Add selected friends as group members
      if (selectedFriends.length > 0) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        for (const friendId of selectedFriends) {
          await supabase
            .from('group_members')
            .insert({
              group_id: data.id,
              user_id: friendId,
              role: 'member',
            })
        }
      }

      router.push(`/groups/${data.id}`)
      router.refresh()
      onClose()
      setName('')
      setSelectedFriends([])
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

          {/* Friend Selector */}
          {friends.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => setShowFriendSelector(!showFriendSelector)}
                className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2 sm:mb-3 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Add Friends to Group</span>
                  {selectedFriends.length > 0 && (
                    <span className="rounded-full bg-gray-900 text-white text-xs px-2 py-0.5">
                      {selectedFriends.length}
                    </span>
                  )}
                </div>
                {showFriendSelector ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showFriendSelector && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                  {/* Search Bar */}
                  <div className="p-2 border-b border-gray-200 bg-white">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search friends..."
                        value={friendSearchQuery}
                        onChange={(e) => setFriendSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  
                  {/* Friends List */}
                  <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                    {loadingFriends ? (
                      <p className="text-sm text-gray-500 text-center py-4">Loading friends...</p>
                    ) : filteredFriends.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {friendSearchQuery ? 'No matches found' : 'No friends yet'}
                      </p>
                    ) : (
                      filteredFriends.map((friend) => (
                        <label
                          key={friend.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedFriends.includes(friend.id)
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFriends.includes(friend.id)}
                            onChange={() => toggleFriend(friend.id)}
                            className="sr-only"
                          />
                          <Avatar
                            src={friend.avatar_url}
                            alt={friend.name || 'User'}
                            name={friend.name}
                            email={friend.email}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedFriends.includes(friend.id) ? 'text-white' : 'text-gray-900'
                            }`}>
                              {friend.name || friend.email || 'Unknown'}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* Selected Friends Chips */}
              {selectedFriends.length > 0 && !showFriendSelector && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFriends.map((friendId) => {
                    const friend = friends.find(f => f.id === friendId)
                    if (!friend) return null
                    return (
                      <span
                        key={friendId}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {friend.name || friend.email}
                        <button
                          type="button"
                          onClick={() => toggleFriend(friendId)}
                          className="ml-1 hover:text-gray-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Note: Friends will be added after the group is created. You can also invite members later via invite link.
              </p>
            </div>
          )}
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

