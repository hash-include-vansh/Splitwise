import type { UserNetBalance } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

interface BalanceCardProps {
  balance: UserNetBalance
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const user = balance.user
  const isPositive = balance.net_balance > 0
  const isZero = Math.abs(balance.net_balance) < 0.01

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
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
            </p>
            <p className="text-xs text-gray-500">
              {isZero
                ? 'Settled up'
                : isPositive
                ? 'Gets back'
                : 'Owes'}
            </p>
          </div>
        </div>
        <div
          className={`text-lg font-bold ${
            isZero
              ? 'text-gray-500'
              : isPositive
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {isZero
            ? '₹0.00'
            : isPositive
            ? `+₹${balance.net_balance.toFixed(2)}`
            : `-₹${Math.abs(balance.net_balance).toFixed(2)}`}
        </div>
      </div>
    </div>
  )
}

