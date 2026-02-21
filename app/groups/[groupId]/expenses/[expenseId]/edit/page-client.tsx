'use client'

import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import type { GroupMember, Expense } from '@/lib/types'
import Link from 'next/link'

interface EditExpensePageClientProps {
  groupId: string
  expense: Expense
  members: GroupMember[]
  currentUserId: string
}

export function EditExpensePageClient({
  groupId,
  expense,
  members,
  currentUserId,
}: EditExpensePageClientProps) {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-5xl">
      <div className="mb-4 sm:mb-6">
        <Link
          href={`/groups/${groupId}/expenses/${expense.id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-3 sm:mb-4"
        >
          <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Expense
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Edit Expense
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
          Update the details of this expense
        </p>
      </div>
      <div className="max-w-2xl">
        <div className="rounded-xl sm:rounded-2xl border border-gray-300 dark:border-gray-700 sm:border-2 bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8 shadow-lg dark:shadow-none sm:shadow-xl">
          <ExpenseForm
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
            initialData={expense}
          />
        </div>
      </div>
    </div>
  )
}
