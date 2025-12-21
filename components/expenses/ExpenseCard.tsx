import { PrefetchLink } from '@/components/ui/PrefetchLink'
import type { Expense } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { Receipt } from 'lucide-react'

interface ExpenseCardProps {
  expense: Expense
  groupId: string
}

export function ExpenseCard({ expense, groupId }: ExpenseCardProps) {
  const paidByUser = expense.paid_by_user
  const totalOwed = expense.splits?.reduce((sum, split) => sum + split.owed_amount, 0) || 0

  return (
    <PrefetchLink
      href={`/groups/${groupId}/expenses/${expense.id}`}
      className="group block rounded-xl bg-white border border-gray-200/60 p-4 shadow-elegant hover:shadow-medium hover:border-gray-300/60 transition-all duration-200"
      prefetch={true}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900">
              <Receipt className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 mb-1 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              {expense.description}
            </h3>
            <div className="flex items-center gap-2">
              <Avatar
                src={paidByUser?.avatar_url}
                alt={paidByUser?.name || 'User'}
                name={paidByUser?.name}
                email={paidByUser?.email}
                size="xs"
              />
              <p className="text-xs font-medium text-gray-600 truncate">
                {paidByUser?.name || paidByUser?.email || 'Unknown'}
              </p>
              <span className="text-gray-400 hidden sm:inline">•</span>
              <p className="text-xs font-medium text-gray-500 hidden sm:block">
                {new Date(expense.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-base font-black text-gray-900 mb-0.5 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            ₹{expense.amount.toFixed(2)}
          </div>
          {expense.splits && expense.splits.length > 0 && (
            <div className="text-xs font-medium text-gray-500">
              {expense.splits.length} {expense.splits.length === 1 ? 'person' : 'people'}
            </div>
          )}
        </div>
      </div>
    </PrefetchLink>
  )
}

