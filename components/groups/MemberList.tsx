import type { GroupMember } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

interface MemberListProps {
  members: GroupMember[]
  currentUserId?: string
  onRemoveMember?: (userId: string) => void
  showHeader?: boolean
}

export function MemberList({ members, currentUserId, onRemoveMember, showHeader = false }: MemberListProps) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-4 sm:p-6 shadow-elegant">
      {showHeader && (
        <div className="mb-4 pb-4 border-b border-gray-200/60">
          <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
            Members
          </h3>
          <p className="text-sm font-medium text-gray-500">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
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
              {canRemove && (
                <button
                  onClick={() => onRemoveMember?.(member.user_id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 transition-all active:scale-95 flex-shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

