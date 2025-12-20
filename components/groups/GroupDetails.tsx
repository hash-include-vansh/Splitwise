import { InviteMember } from './InviteMember'
import { MemberList } from './MemberList'
import Link from 'next/link'
import type { Group, GroupMember } from '@/lib/types'

interface GroupDetailsProps {
  group: Group & { members: GroupMember[] }
  currentUserId?: string
  onRemoveMember?: (userId: string) => void
}

export function GroupDetails({ group, currentUserId, onRemoveMember }: GroupDetailsProps) {
  const isAdmin = group.members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Created {new Date(group.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/groups/${group.id}/expenses`}
          className="rounded-lg border border-gray-200 bg-white p-6 text-center transition-shadow hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
          <p className="mt-2 text-sm text-gray-600">View and manage expenses</p>
        </Link>
        <Link
          href={`/groups/${group.id}/balances`}
          className="rounded-lg border border-gray-200 bg-white p-6 text-center transition-shadow hover:shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-900">Balances</h3>
          <p className="mt-2 text-sm text-gray-600">View who owes what</p>
        </Link>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Members</h3>
          <p className="mt-2 text-sm text-gray-600">{group.members.length} members</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MemberList
          members={group.members}
          currentUserId={currentUserId}
          onRemoveMember={isAdmin ? onRemoveMember : undefined}
        />
        {isAdmin && <InviteMember groupId={group.id} />}
      </div>
    </div>
  )
}
