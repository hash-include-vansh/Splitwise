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
    <div className={`rounded-xl border p-4 bg-white shadow-elegant transition-all hover:shadow-medium ${
      isZero
        ? 'border-gray-200/60'
        : isPositive
        ? 'border-green-200/60'
        : 'border-red-200/60'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar
            src={user?.avatar_url}
            alt={user?.name || 'User'}
            name={user?.name}
            email={user?.email}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate mb-0.5 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              {user?.name || user?.email || 'Unknown User'}
            </p>
            <p className={`text-xs font-medium ${
              isZero
                ? 'text-gray-500'
                : isPositive
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {isZero
                ? 'Settled up'
                : isPositive
                ? 'Gets back'
                : 'Owes'}
            </p>
          </div>
        </div>
        <div
          className={`text-lg font-black tracking-tight flex-shrink-0 ${
            isZero
              ? 'text-gray-500'
              : isPositive
              ? 'text-green-600'
              : 'text-red-600'
          }`}
          style={{ letterSpacing: '-0.02em' }}
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

