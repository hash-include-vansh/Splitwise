'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateGroup, useLeaveGroup } from '@/hooks/useGroups'
import { queryKeys } from '@/lib/queries/keys'
import { DeleteGroupButton } from '@/components/groups/DeleteGroupButton'
import { InviteMember } from '@/components/groups/InviteMember'
import { Avatar } from '@/components/ui/Avatar'
import type { Group, GroupMember } from '@/lib/types'
import { Settings, Save, LogOut, Loader2, Shield, User, ChevronLeft } from 'lucide-react'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { DEFAULT_GROUP_EMOJI } from '@/lib/constants/groupEmojis'

interface GroupSettingsClientProps {
  initialGroup: Group & { members: GroupMember[] }
  currentUserId: string
}

export function GroupSettingsClient({ initialGroup, currentUserId }: GroupSettingsClientProps) {
  const [groupName, setGroupName] = useState(initialGroup.name)
  const [groupEmoji, setGroupEmoji] = useState(initialGroup.emoji || DEFAULT_GROUP_EMOJI)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [emojiWarning, setEmojiWarning] = useState(false)
  const router = useRouter()

  const queryClient = useQueryClient()
  const updateGroupMutation = useUpdateGroup()
  const leaveGroupMutation = useLeaveGroup()

  const isAdmin = initialGroup.members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  )

  const hasChanges = groupName.trim() !== initialGroup.name || groupEmoji !== (initialGroup.emoji || DEFAULT_GROUP_EMOJI)

  // Navigate back to group page, busting the Next.js Router Cache
  // so the group detail and groups list pages fetch fresh server data.
  const navigateBack = useCallback(() => {
    router.push(`/groups/${initialGroup.id}`)
    router.refresh()
  }, [router, initialGroup.id])

  const handleSaveSettings = async () => {
    if (!groupName.trim() || !hasChanges) return

    try {
      setEmojiWarning(false)
      const result = await updateGroupMutation.mutateAsync({
        groupId: initialGroup.id,
        name: groupName.trim(),
        emoji: groupEmoji,
      })

      // Check if emoji was actually saved (the returned data should have the emoji)
      const emojiChanged = groupEmoji !== (initialGroup.emoji || DEFAULT_GROUP_EMOJI)
      if (emojiChanged && result && !result.emoji) {
        setEmojiWarning(true)
        setTimeout(() => setEmojiWarning(false), 5000)
        // Don't navigate away — user needs to see the emoji warning
        return
      }

      // Directly update the React Query cache BEFORE navigation to guarantee
      // the group detail and list pages show the new name/emoji immediately.
      // This is synchronous — no race condition with async onSuccess callbacks.
      const newName = groupName.trim()
      const newEmoji = groupEmoji

      queryClient.setQueryData(
        queryKeys.groups.detail(initialGroup.id),
        (old: any) => old ? { ...old, name: newName, emoji: newEmoji } : old
      )
      queryClient.setQueryData(
        queryKeys.groups.lists(),
        (old: any[]) => old?.map((g: any) =>
          g.id === initialGroup.id ? { ...g, name: newName, emoji: newEmoji } : g
        )
      )

      // Navigate back — cache is already updated, so the group page shows fresh data
      navigateBack()
    } catch {
      // Error is handled by the mutation's isError state
    }
  }

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupMutation.mutateAsync(initialGroup.id)
      router.push('/groups')
      router.refresh()
    } catch (err: any) {
      console.error('Error leaving group:', err)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Button */}
      <button
        onClick={navigateBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Group
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            Group Settings
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
          Manage settings for {initialGroup.name}
        </p>
      </div>

      {/* Group Icon & Name (Admin Only) */}
      <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-elegant">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Group Icon & Name
        </h3>
        {isAdmin ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <EmojiPicker value={groupEmoji} onChange={setGroupEmoji} size="lg" />
              <div className="flex-1">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                  placeholder="Enter group name"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  Click the emoji to change the group icon
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveSettings}
                disabled={updateGroupMutation.isPending || !groupName.trim() || !hasChanges}
                className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-5 py-3 text-sm sm:text-base font-semibold text-white dark:text-gray-900 shadow-elegant hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
              >
                {updateGroupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {updateGroupMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {emojiWarning && (
                <Link href="/setup" className="text-sm font-medium text-amber-600 dark:text-amber-400 underline hover:text-amber-800 dark:hover:text-amber-300">
                  Emoji could not be saved — run database setup →
                </Link>
              )}
              {updateGroupMutation.isError && (
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {updateGroupMutation.error?.message || 'Failed to update'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{initialGroup.emoji || DEFAULT_GROUP_EMOJI}</span>
            <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200/60 dark:border-gray-700/60 flex-1">
              {initialGroup.name}
            </p>
          </div>
        )}
        {!isAdmin && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            Only group admins can change the group icon and name.
          </p>
        )}
      </div>

      {/* Members List */}
      <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-elegant">
        <div className="mb-4 pb-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            Members
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-500">
            {initialGroup.members.length} {initialGroup.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {initialGroup.members.map((member) => {
            const user = member.user
            const isCurrentUser = member.user_id === currentUserId
            const isMemberAdmin = member.role === 'admin'

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-3 shadow-sm hover:shadow-elegant hover:border-gray-300/60 dark:hover:border-gray-600/60 transition-all"
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
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                      {user?.name || user?.email || 'Unknown User'}
                      {isCurrentUser && ' (You)'}
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isMemberAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800/50 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      Member
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite Members (Admin Only) */}
      {isAdmin && (
        <InviteMember groupId={initialGroup.id} />
      )}

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200/60 dark:border-red-800/60 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-elegant">
        <h3 className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-300 mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          Danger Zone
        </h3>
        <div className="space-y-4">
          {/* Leave Group */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-4">
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-300 mb-0.5">Leave Group</p>
              <p className="text-xs text-red-700 dark:text-red-400">
                You must settle all balances before leaving.
                {isAdmin && initialGroup.members.filter(m => m.role === 'admin').length === 1 && initialGroup.members.length > 1 && (
                  ' As the only admin, another member will be promoted.'
                )}
                {initialGroup.members.length === 1 && (
                  ' Since you are the last member, the group will be deleted.'
                )}
              </p>
            </div>
            {!showLeaveConfirm ? (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-all active:scale-95 flex-shrink-0"
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  <LogOut className="h-4 w-4" />
                  Leave Group
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-red-900 dark:text-red-300">
                  Are you sure you want to leave &quot;{initialGroup.name}&quot;?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    disabled={leaveGroupMutation.isPending}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLeaveGroup}
                    disabled={leaveGroupMutation.isPending}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    {leaveGroupMutation.isPending ? 'Leaving...' : 'Confirm Leave'}
                  </button>
                </div>
                {leaveGroupMutation.isError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 border border-red-200 dark:border-red-800">
                    {leaveGroupMutation.error?.message || 'Failed to leave group'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Delete Group (Admin Only) */}
          {isAdmin && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-4">
              <div>
                <p className="text-sm font-bold text-red-900 dark:text-red-300 mb-0.5">Delete Group</p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Permanently delete this group and all its expenses. This action cannot be undone.
                </p>
              </div>
              <div className="flex-shrink-0">
                <DeleteGroupButton groupId={initialGroup.id} groupName={initialGroup.name} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
