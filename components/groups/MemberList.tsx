import type { GroupMember } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

interface MemberListProps {
  members: GroupMember[]
  currentUserId?: string
  onRemoveMember?: (userId: string) => void
}

export function MemberList({ members, currentUserId, onRemoveMember }: MemberListProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
      <div className="space-y-2">
        {members.map((member) => {
          const user = member.user
          const isCurrentUser = member.user_id === currentUserId
          const isAdmin = member.role === 'admin'
          const canRemove = onRemoveMember && !isCurrentUser && isAdmin

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.avatar_url}
                  alt={user?.name || 'User'}
                  name={user?.name}
                  email={user?.email}
                  size="md"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || user?.email || 'Unknown User'}
                    {isCurrentUser && ' (You)'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
              </div>
              {canRemove && (
                <button
                  onClick={() => onRemoveMember?.(member.user_id)}
                  className="rounded-lg bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
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

