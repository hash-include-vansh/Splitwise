import type { SimplifiedDebt } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface SimplifiedDebtViewProps {
  debts: SimplifiedDebt[]
}

export function SimplifiedDebtView({ debts }: SimplifiedDebtViewProps) {
  if (debts.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 mb-6">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            All settled up!
          </h3>
          <p className="text-base font-medium text-gray-600 max-w-sm mx-auto">
            No debts to simplify. Everyone&apos;s square!
          </p>
        </div>
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
            className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60"
          >
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar
                  src={fromUser?.avatar_url}
                  alt={fromUser?.name || 'User'}
                  name={fromUser?.name}
                  email={fromUser?.email}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 mb-0.5 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                    {fromUser?.name || fromUser?.email || 'Unknown'}
                  </p>
                  <p className="text-xs font-medium text-gray-500">owes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="text-center">
                  <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                    ₹{debt.amount.toFixed(2)}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar
                    src={toUser?.avatar_url}
                    alt={toUser?.name || 'User'}
                    name={toUser?.name}
                    email={toUser?.email}
                    size="sm"
                  />
                  <p className="text-sm font-bold text-gray-900 truncate tracking-tight hidden sm:block" style={{ letterSpacing: '-0.01em' }}>
                    {toUser?.name || toUser?.email || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

