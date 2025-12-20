import Link from 'next/link'
import type { Expense } from '@/lib/types'

interface ExpenseCardProps {
  expense: Expense
  groupId: string
}

export function ExpenseCard({ expense, groupId }: ExpenseCardProps) {
  const paidByUser = expense.paid_by_user
  const totalOwed = expense.splits?.reduce((sum, split) => sum + split.owed_amount, 0) || 0

  return (
    <Link
      href={`/groups/${groupId}/expenses/${expense.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{expense.description}</h3>
          <p className="mt-1 text-sm text-gray-600">
            Paid by {paidByUser?.name || paidByUser?.email || 'Unknown'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {new Date(expense.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">₹{expense.amount.toFixed(2)}</div>
          {expense.splits && expense.splits.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {expense.splits.length} {expense.splits.length === 1 ? 'person' : 'people'}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

