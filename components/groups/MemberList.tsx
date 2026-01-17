'use client'

import { useState, useEffect, useMemo } from 'react'
import type { GroupMember, Friendship, User } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { UserPlus, Check, Loader2, X, Search, Users } from 'lucide-react'
import { addFriend, checkFriendship, getFriends } from '@/lib/services/friends-client'
import { createClient } from '@/lib/supabase/client'

interface MemberListProps {
  members: GroupMember[]
  currentUserId?: string
  groupId?: string
  onRemoveMember?: (userId: string) => void
  onMemberAdded?: () => void
  showHeader?: boolean
}

export function MemberList({ members, currentUserId, groupId, onRemoveMember, onMemberAdded, showHeader = false }: MemberListProps) {
  const [friendships, setFriendships] = useState<Record<string, boolean>>({})
  const [addingFriend, setAddingFriend] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [friends, setFriends] = useState<User[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [addingMember, setAddingMember] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (currentUserId) {
      checkFriendships()
    }
  }, [currentUserId, members])

  async function checkFriendships() {
    if (!currentUserId) return
    
    const friendshipStatus: Record<string, boolean> = {}
    
    for (const member of members) {
      if (member.user_id !== currentUserId) {
        const { isFriend } = await checkFriendship(currentUserId, member.user_id)
        friendshipStatus[member.user_id] = isFriend
      }
    }
    
    setFriendships(friendshipStatus)
  }

  async function handleAddFriend(friendId: string) {
    if (!currentUserId) return
    
    setAddingFriend(friendId)
    try {
      const { error } = await addFriend(currentUserId, friendId)
      if (!error) {
        setFriendships(prev => ({ ...prev, [friendId]: true }))
      }
    } catch (err) {
      console.error('Error adding friend:', err)
    } finally {
      setAddingFriend(null)
    }
  }

  async function loadFriends() {
    if (!currentUserId) return
    
    setLoadingFriends(true)
    try {
      const { data } = await getFriends(currentUserId)
      setFriends(data || [])
    } catch (err) {
      console.error('Error loading friends:', err)
    } finally {
      setLoadingFriends(false)
    }
  }

  function openAddModal() {
    setShowAddModal(true)
    setSearchQuery('')
    loadFriends()
  }

  async function addMemberToGroup(friendId: string) {
    if (!groupId) return
    
    setAddingMember(friendId)
    try {
      const supabase = createClient()
      
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', friendId)
        .single()
      
      if (existing) {
        alert('This person is already a member of this group')
        setAddingMember(null)
        return
      }
      
      // Add member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: friendId,
          role: 'member'
        })
      
      if (error) throw error
      
      // Notify parent to refresh
      onMemberAdded?.()
      setShowAddModal(false)
    } catch (err: any) {
      console.error('Error adding member:', err)
      alert(err.message || 'Failed to add member')
    } finally {
      setAddingMember(null)
    }
  }

  // Filter friends that aren't already members
  const memberIds = new Set(members.map(m => m.user_id))
  const availableFriends = useMemo(() => {
    return friends.filter(f => !memberIds.has(f.id))
  }, [friends, memberIds])

  // Filter by search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return availableFriends
    const query = searchQuery.toLowerCase()
    return availableFriends.filter(f => 
      f.name?.toLowerCase().includes(query) || 
      f.email?.toLowerCase().includes(query)
    )
  }, [availableFriends, searchQuery])
  return (
    <>
    <div className="rounded-xl border border-gray-200/60 bg-white p-4 sm:p-6 shadow-elegant">
      {showHeader && (
        <div className="mb-4 pb-4 border-b border-gray-200/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              Members
            </h3>
            <p className="text-sm font-medium text-gray-500">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          {currentUserId && groupId && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-all active:scale-95 shadow-elegant"
            >
              <UserPlus className="h-4 w-4" />
              Add from Friends
            </button>
          )}
        </div>
      )}
      <div className="space-y-2 sm:space-y-3">
        {members.map((member) => {
          const user = member.user
          const isCurrentUser = member.user_id === currentUserId
          const isAdmin = member.role === 'admin'
          const canRemove = onRemoveMember && !isCurrentUser && isAdmin

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-gray-200/60 bg-white p-3 shadow-sm hover:shadow-elegant hover:border-gray-300/60 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Avatar
                  src={user?.avatar_url}
                  alt={user?.name || 'User'}
                  name={user?.name}
                  email={user?.email}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 mb-0.5 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                    {user?.name || user?.email || 'Unknown User'}
                    {isCurrentUser && ' (You)'}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Add Friend Button */}
                {currentUserId && !isCurrentUser && (
                  friendships[member.user_id] ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700">
                      <Check className="h-3 w-3" />
                      Friend
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(member.user_id)}
                      disabled={addingFriend === member.user_id}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50"
                      title="Add as friend"
                    >
                      {addingFriend === member.user_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserPlus className="h-3 w-3" />
                      )}
                      Add
                    </button>
                  )
                )}
                
                {/* Remove Button */}
                {canRemove && (
                  <button
                    onClick={() => onRemoveMember?.(member.user_id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 transition-all active:scale-95"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Add from Friends Modal */}
    {showAddModal && (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-[100]"
          onClick={() => setShowAddModal(false)}
        />
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  Add from Friends
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingFriends ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  {friends.length === 0 ? (
                    <>
                      <p className="text-gray-500 font-medium">No friends yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Add friends from group members to see them here
                      </p>
                    </>
                  ) : availableFriends.length === 0 ? (
                    <>
                      <p className="text-gray-500 font-medium">All friends are already members</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Use the invite link to add new people
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 font-medium">No matches found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try a different search term
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar
                          src={friend.avatar_url}
                          alt={friend.name || 'User'}
                          name={friend.name}
                          email={friend.email}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {friend.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {friend.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => addMemberToGroup(friend.id)}
                        disabled={addingMember === friend.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {addingMember === friend.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}
    </>
  )
}

