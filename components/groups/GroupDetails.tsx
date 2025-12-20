import { InviteMember } from './InviteMember'
import { MemberList } from './MemberList'
import { DeleteGroupButton } from './DeleteGroupButton'
import Link from 'next/link'
import type { Group, GroupMember } from '@/lib/types'
import { Receipt, TrendingUp, Users as UsersIcon } from 'lucide-react'

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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            {group.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Created {new Date(group.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
        {isAdmin && (
          <DeleteGroupButton groupId={group.id} groupName={group.name} />
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href={`/groups/${group.id}/expenses`}
          className="group flex-1 rounded-xl border border-gray-200/60 bg-white p-5 text-center shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 mb-3 group-hover:scale-105 transition-transform duration-200">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>Expenses</h3>
          <p className="text-xs font-medium text-gray-600">View and manage expenses</p>
        </Link>
        <Link
          href={`/groups/${group.id}/balances`}
          className="group flex-1 rounded-xl border border-gray-200/60 bg-white p-5 text-center shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 mb-3 group-hover:scale-105 transition-transform duration-200">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>Balances</h3>
          <p className="text-xs font-medium text-gray-600">View who owes what</p>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        <MemberList
          members={group.members}
          currentUserId={currentUserId}
          onRemoveMember={isAdmin ? onRemoveMember : undefined}
          showHeader={true}
        />
        {isAdmin && <InviteMember groupId={group.id} />}
      </div>
    </div>
  )
}
