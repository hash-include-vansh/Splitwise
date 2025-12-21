import { ExpenseCard } from './ExpenseCard'
import { ExpenseListSkeleton } from '@/components/ui/Skeleton'
import type { Expense } from '@/lib/types'
import { Receipt } from 'lucide-react'

interface ExpenseListProps {
  expenses: Expense[]
  groupId: string
  isLoading?: boolean
}

export function ExpenseList({ expenses, groupId, isLoading }: ExpenseListProps) {
  if (isLoading) {
    return <ExpenseListSkeleton count={5} />
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 mb-6">
            <Receipt className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            No expenses yet
          </h3>
          <p className="text-base font-medium text-gray-600 max-w-sm mx-auto">
            Add your first expense to start tracking shared costs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} groupId={groupId} />
      ))}
    </div>
  )
}

