import type { SimplifiedDebt } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface SimplifiedDebtViewProps {
  debts: SimplifiedDebt[]
  groupId: string
}

export function SimplifiedDebtView({ debts, groupId }: SimplifiedDebtViewProps) {
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

  // Sort debts: unsettled first, then settled
  const sortedDebts = [...debts].sort((a, b) => {
    if (a.isSettled && !b.isSettled) return 1
    if (!a.isSettled && b.isSettled) return -1
    return b.amount - a.amount
  })

  return (
    <div className="space-y-4">
      {sortedDebts.map((debt, index) => {
        const fromUser = debt.from_user
        const toUser = debt.to_user
        const isSettled = debt.isSettled

        return (
          <Link
            key={`${debt.from_user_id}-${debt.to_user_id}-${index}`}
            href={`/groups/${groupId}/balances/${debt.from_user_id}/${debt.to_user_id}?amount=${(debt.originalAmount || debt.amount).toFixed(2)}`}
            className={`block rounded-xl border p-4 shadow-elegant transition-all hover:shadow-medium cursor-pointer ${
              isSettled 
                ? 'border-green-200 bg-green-50/50 hover:border-green-300' 
                : 'border-gray-200/60 bg-white hover:border-gray-300/60'
            }`}
          >
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isSettled && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
                <Avatar
                  src={fromUser?.avatar_url}
                  alt={fromUser?.name || 'User'}
                  name={fromUser?.name}
                  email={fromUser?.email}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className={`text-sm font-bold mb-0.5 truncate tracking-tight ${isSettled ? 'text-green-700 line-through' : 'text-gray-900'}`} style={{ letterSpacing: '-0.01em' }}>
                    {fromUser?.name || fromUser?.email || 'Unknown'}
                  </p>
                  <p className={`text-xs font-medium ${isSettled ? 'text-green-600' : 'text-gray-500'}`}>
                    {isSettled ? 'paid' : 'owes'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="text-center">
                  {isSettled ? (
                    <div className="text-base sm:text-lg font-black text-green-600 tracking-tight line-through" style={{ letterSpacing: '-0.02em' }}>
                      ₹{(debt.originalAmount || debt.amount).toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                      ₹{debt.amount.toFixed(2)}
                    </div>
                  )}
                  {debt.paidAmount && debt.paidAmount > 0 && !isSettled && (
                    <div className="text-[10px] text-green-600">
                      ₹{debt.paidAmount.toFixed(2)} paid
                    </div>
                  )}
                </div>
                <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isSettled ? 'text-green-400' : 'text-gray-400'}`} />
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar
                    src={toUser?.avatar_url}
                    alt={toUser?.name || 'User'}
                    name={toUser?.name}
                    email={toUser?.email}
                    size="sm"
                  />
                  <p className={`text-sm font-bold truncate tracking-tight hidden sm:block ${isSettled ? 'text-green-700' : 'text-gray-900'}`} style={{ letterSpacing: '-0.01em' }}>
                    {toUser?.name || toUser?.email || 'Unknown'}
                  </p>
                </div>
                <ChevronRight className={`h-4 w-4 flex-shrink-0 ml-1 ${isSettled ? 'text-green-400' : 'text-gray-400'}`} />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

