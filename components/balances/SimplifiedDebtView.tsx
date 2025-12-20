import type { SimplifiedDebt } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

interface SimplifiedDebtViewProps {
  debts: SimplifiedDebt[]
}

export function SimplifiedDebtView({ debts }: SimplifiedDebtViewProps) {
  if (debts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">All settled up! No debts to simplify.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {debts.map((debt, index) => {
        const fromUser = debt.from_user
        const toUser = debt.to_user

        return (
          <div
            key={`${debt.from_user_id}-${debt.to_user_id}-${index}`}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={fromUser?.avatar_url}
                  alt={fromUser?.name || 'User'}
                  name={fromUser?.name}
                  email={fromUser?.email}
                  size="md"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fromUser?.name || fromUser?.email || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">owes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    ₹{debt.amount.toFixed(2)}
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={toUser?.avatar_url}
                    alt={toUser?.name || 'User'}
                    name={toUser?.name}
                    email={toUser?.email}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {toUser?.name || toUser?.email || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

