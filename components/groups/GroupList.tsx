import { GroupCard } from './GroupCard'
import { GroupListSkeleton } from '@/components/ui/Skeleton'
import type { Group } from '@/lib/types'
import { Users } from 'lucide-react'

interface GroupListProps {
  groups: Group[]
  isLoading?: boolean
}

export function GroupList({ groups, isLoading }: GroupListProps) {
  if (isLoading) {
    return <GroupListSkeleton count={5} />
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 mb-6">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            No groups yet
          </h3>
          <p className="text-base font-medium text-gray-600 max-w-sm mx-auto">
            Create your first group to start splitting expenses with friends.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}

