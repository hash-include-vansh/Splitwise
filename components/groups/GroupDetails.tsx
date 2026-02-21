import { InviteMember } from './InviteMember'
import { MemberList } from './MemberList'
import { DeleteGroupButton } from './DeleteGroupButton'
import { PrefetchLink } from '@/components/ui/PrefetchLink'
import type { Group, GroupMember } from '@/lib/types'
import { Receipt, TrendingUp, Users as UsersIcon, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { DEFAULT_GROUP_EMOJI } from '@/lib/constants/groupEmojis'

interface GroupDetailsProps {
  group: Group & { members: GroupMember[] }
  currentUserId?: string
  onRemoveMember?: (userId: string) => void
  onMemberAdded?: () => void
}

export function GroupDetails({ group, currentUserId, onRemoveMember, onMemberAdded }: GroupDetailsProps) {
  const isAdmin = group.members.some(
    (m) => m.user_id === currentUserId && m.role === 'admin'
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-4xl sm:text-5xl">{group.emoji || DEFAULT_GROUP_EMOJI}</span>
          <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            {group.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            Created {new Date(group.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          </div>
        </div>
        <Link
          href={`/groups/${group.id}/settings`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-elegant hover:shadow-medium hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <PrefetchLink
          href={`/groups/${group.id}/expenses`}
          className="group rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-5 text-center shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60 dark:hover:border-gray-600/60"
        >
          <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-200">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-white dark:text-gray-900" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>Expenses</h3>
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:block">View & manage</p>
        </PrefetchLink>
        <PrefetchLink
          href={`/groups/${group.id}/balances`}
          className="group rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-5 text-center shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60 dark:hover:border-gray-600/60"
          prefetch={false}
        >
          <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-200">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white dark:text-gray-900" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>Balances</h3>
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:block">Who owes what</p>
        </PrefetchLink>
        <PrefetchLink
          href={`/groups/${group.id}/analytics`}
          className="group rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-5 text-center shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60 dark:hover:border-gray-600/60"
          prefetch={false}
        >
          <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 mb-2 sm:mb-3 group-hover:scale-105 transition-transform duration-200">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white dark:text-gray-900" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>Analytics</h3>
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:block">Fun insights</p>
        </PrefetchLink>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        <MemberList
          members={group.members}
          currentUserId={currentUserId}
          groupId={group.id}
          isAdmin={isAdmin}
          onRemoveMember={isAdmin ? onRemoveMember : undefined}
          onMemberAdded={onMemberAdded}
          showHeader={true}
        />
        {isAdmin && <InviteMember groupId={group.id} />}
      </div>
    </div>
  )
}
