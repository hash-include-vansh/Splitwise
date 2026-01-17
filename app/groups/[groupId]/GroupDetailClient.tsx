'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GroupDetails } from '@/components/groups/GroupDetails'
import type { Group, GroupMember } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface GroupDetailClientProps {
  initialGroup: Group & { members: GroupMember[] }
  currentUserId: string
}

export function GroupDetailClient({ initialGroup, currentUserId }: GroupDetailClientProps) {
  const [group, setGroup] = useState(initialGroup)
  const router = useRouter()

  const refreshGroup = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', group.id)
        .single()
      
      if (groupError) throw groupError
      
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users (*)
        `)
        .eq('group_id', group.id)
      
      if (membersError) throw membersError
      
      setGroup({
        ...groupData,
        members: members || []
      })
    } catch (err) {
      console.error('Error refreshing group:', err)
      // Fallback to router refresh
      router.refresh()
    }
  }, [group.id, router])

  const handleRemoveMember = async (userIdToRemove: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', userIdToRemove)
      
      if (error) throw error
      
      // Refresh group data
      await refreshGroup()
    } catch (err) {
      console.error('Error removing member:', err)
    }
  }

  const isAdmin = group.members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  )

  return (
    <GroupDetails
      group={group}
      currentUserId={currentUserId}
      onRemoveMember={isAdmin ? handleRemoveMember : undefined}
      onMemberAdded={refreshGroup}
    />
  )
}

