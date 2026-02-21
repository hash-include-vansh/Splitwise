'use client'

import { GroupList } from '@/components/groups/GroupList'
import { CreateGroupButton } from '@/components/groups/CreateGroupButton'
import { useUserGroups } from '@/hooks/useGroups'
import type { Group } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface GroupsPageClientProps {
  initialGroups: Group[]
  currentUser: User
}

export function GroupsPageClient({ initialGroups, currentUser }: GroupsPageClientProps) {
  // Pass initialGroups as initialData so the query cache is seeded immediately
  // (no waiting for useAuth to resolve). staleTime: 0 ensures a refetch on mount
  // to pick up any changes made on other pages (e.g. group name/emoji in settings).
  const { data: groups } = useUserGroups(initialGroups)

  // React Query data is always available thanks to initialData, but fallback just in case
  const displayGroups = groups ?? initialGroups

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          My Groups
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mb-4">
          {displayGroups.length} {displayGroups.length === 1 ? 'group' : 'groups'}
        </p>
        <CreateGroupButton initialUser={currentUser} />
      </div>
      <GroupList groups={displayGroups} />
    </>
  )
}
