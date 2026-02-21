'use client'

import { Download } from 'lucide-react'
import { generateExpenseCsv, downloadCsv } from '@/lib/utils/exportCsv'
import type { Expense } from '@/lib/types'

interface ExportButtonProps {
  expenses: Expense[]
  currentUserId: string
  groupName: string
}

export function ExportButton({ expenses, currentUserId, groupName }: ExportButtonProps) {
  const handleExport = () => {
    const csvContent = generateExpenseCsv(expenses, currentUserId)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const filename = `${groupName}_expenses_${year}-${month}-${day}.csv`
    downloadCsv(csvContent, filename)
  }

  return (
    <button
      onClick={handleExport}
      disabled={expenses.length === 0}
      className="group flex items-center gap-2 sm:gap-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-sm"
    >
      <Download className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:-translate-y-0.5 duration-200" />
      <span className="hidden sm:inline">Export CSV</span>
      <span className="sm:hidden">Export</span>
    </button>
  )
}
