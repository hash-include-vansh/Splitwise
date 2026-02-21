'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { GroupDetails } from '@/components/groups/GroupDetails'
import { useGroupDetails } from '@/hooks/useGroups'
import type { Group, GroupMember } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/queries/keys'

interface GroupDetailClientProps {
  initialGroup: Group & { members: GroupMember[] }
  currentUserId: string
}

export function GroupDetailClient({ initialGroup, currentUserId }: GroupDetailClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Pass initialGroup as initialData so cache is seeded immediately,
  // and staleTime: 0 ensures a refetch on mount to pick up any settings changes
  const { data: group } = useGroupDetails(initialGroup.id, initialGroup)

  // React Query data is always available thanks to initialData, but fallback just in case
  const currentGroup = group || initialGroup

  const refreshGroup = useCallback(async () => {
    // Invalidate React Query cache to trigger refetch
    await queryClient.invalidateQueries({
      queryKey: queryKeys.groups.detail(initialGroup.id),
    })
  }, [initialGroup.id, queryClient])

  const handleRemoveMember = async (userIdToRemove: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', initialGroup.id)
        .eq('user_id', userIdToRemove)

      if (error) throw error

      // Refresh group data via React Query invalidation
      await refreshGroup()
    } catch (err) {
      console.error('Error removing member:', err)
    }
  }

  const isAdmin = currentGroup.members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  )

  return (
    <GroupDetails
      group={currentGroup}
      currentUserId={currentUserId}
      onRemoveMember={isAdmin ? handleRemoveMember : undefined}
      onMemberAdded={refreshGroup}
    />
  )
}
