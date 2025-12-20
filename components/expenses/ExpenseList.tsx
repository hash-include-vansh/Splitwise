import { ExpenseCard } from './ExpenseCard'
import type { Expense } from '@/lib/types'

interface ExpenseListProps {
  expenses: Expense[]
  groupId: string
}

export function ExpenseList({ expenses, groupId }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No expenses yet. Add your first expense to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} groupId={groupId} />
      ))}
    </div>
  )
}

