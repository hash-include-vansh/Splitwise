'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Expense } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { getCategoryByKey } from '@/lib/constants/categories'
import { staggerItem } from '@/lib/animations'

interface ExpenseCardProps {
  expense: Expense
  groupId: string
}

export function ExpenseCard({ expense, groupId }: ExpenseCardProps) {
  const paidByUser = expense.paid_by_user
  const totalOwed = expense.splits?.reduce((sum, split) => sum + split.owed_amount, 0) || 0
  const category = getCategoryByKey(expense.category)
  const CategoryIcon = category.icon

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -1 }}
    >
      <Link
        href={`/groups/${groupId}/expenses/${expense.id}`}
        className="group block rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 p-4 shadow-elegant dark:shadow-none hover:shadow-medium hover:border-gray-300/60 dark:hover:border-gray-600 transition-all duration-200"
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.bgColor}`}>
                <CategoryIcon className={`h-5 w-5 ${category.textColor}`} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
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
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                  {paidByUser?.name || paidByUser?.email || 'Unknown'}
                </p>
                <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">&bull;</span>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-500 hidden sm:block">
                  {new Date(expense.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-base font-black text-gray-900 dark:text-gray-100 mb-0.5 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              ₹{expense.amount.toFixed(2)}
            </div>
            {expense.splits && expense.splits.length > 0 && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-500">
                {expense.splits.length} {expense.splits.length === 1 ? 'person' : 'people'}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
