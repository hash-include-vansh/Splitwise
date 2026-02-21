'use client'

import { useState, useCallback } from 'react'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { useGroupExpenses } from '@/hooks/useExpenses'
import Link from 'next/link'
import { ExpenseListSkeleton } from '@/components/ui/Skeleton'
import { ExportButton } from '@/components/groups/ExportButton'
import type { Expense } from '@/lib/types'

interface ExpensesPageClientProps {
  groupId: string
  groupName: string
  currentUserId: string
}

export function ExpensesPageClient({ groupId, groupName, currentUserId }: ExpensesPageClientProps) {
  const { data: expenses, isLoading } = useGroupExpenses(groupId)
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[] | null>(null)

  const handleFilteredExpenses = useCallback((filtered: Expense[]) => {
    setFilteredExpenses(filtered)
  }, [])

  const allExpenses = expenses || []
  // Before filters have initialized, show all expenses
  const displayExpenses = filteredExpenses ?? allExpenses

  // Build members list for filters from expense data
  const membersList = (() => {
    const seen = new Map<string, { user_id: string; name: string | null; email: string | null }>()
    allExpenses.forEach(e => {
      if (e.paid_by_user && !seen.has(e.paid_by)) {
        seen.set(e.paid_by, {
          user_id: e.paid_by,
          name: e.paid_by_user.name,
          email: e.paid_by_user.email,
        })
      }
    })
    return Array.from(seen.values())
  })()

  const showingFiltered = filteredExpenses !== null && filteredExpenses.length !== allExpenses.length

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {groupName}
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
              {showingFiltered
                ? `${displayExpenses.length} of ${allExpenses.length} expenses`
                : `${allExpenses.length} ${allExpenses.length === 1 ? 'expense' : 'expenses'}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ExportButton
              expenses={allExpenses}
              currentUserId={currentUserId}
              groupName={groupName}
            />
            <Link
              href={`/groups/${groupId}/expenses/new`}
              className="group flex items-center gap-2 sm:gap-3 rounded-xl bg-black dark:bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white dark:text-gray-900 shadow-elegant dark:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>
      </div>

      {!isLoading && allExpenses.length > 0 && (
        <ExpenseFilters
          expenses={allExpenses}
          onFilteredExpenses={handleFilteredExpenses}
          members={membersList}
        />
      )}

      <ExpenseList
        expenses={displayExpenses}
        groupId={groupId}
        isLoading={isLoading}
      />
    </div>
  )
}
