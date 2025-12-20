import { GroupCard } from './GroupCard'
import type { Group } from '@/lib/types'

interface GroupListProps {
  groups: Group[]
}

export function GroupList({ groups }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No groups yet. Create your first group to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}

