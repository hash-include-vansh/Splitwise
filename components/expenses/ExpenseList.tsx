'use client'

import { ExpenseCard } from './ExpenseCard'
import { ExpenseListSkeleton } from '@/components/ui/Skeleton'
import { motion } from 'framer-motion'
import type { Expense } from '@/lib/types'
import { Receipt } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'

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
      <motion.div
        className="text-center py-24"
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={fadeInUp.transition}
      >
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 dark:bg-gray-100 mb-6">
            <Receipt className="h-10 w-10 text-white dark:text-gray-900" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            No expenses yet
          </h3>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Add your first expense to start tracking shared costs.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} groupId={groupId} />
      ))}
    </motion.div>
  )
}
