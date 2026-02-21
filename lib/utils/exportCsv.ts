import type { Expense } from '@/lib/types'
import { getCategoryByKey } from '@/lib/constants/categories'

/**
 * Escapes a CSV field value. Wraps in double quotes if the value contains
 * commas, double quotes, or newlines. Internal double quotes are escaped
 * by doubling them (RFC 4180).
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Formats a date string as YYYY-MM-DD.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generates a CSV string from an array of expenses.
 *
 * Columns: Date, Description, Category, Amount, Paid By, Split Between, Your Share
 */
export function generateExpenseCsv(expenses: Expense[], currentUserId: string): string {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Split Between', 'Your Share']
  const headerRow = headers.map(escapeCsvField).join(',')

  const rows = expenses.map((expense) => {
    const date = formatDate(expense.created_at)
    const description = expense.description
    const category = getCategoryByKey(expense.category).label
    const amount = expense.amount.toFixed(2)
    const paidBy = expense.paid_by_user?.name || expense.paid_by_user?.email || expense.paid_by
    const splitBetween = (expense.splits || [])
      .map((s) => s.user?.name || s.user?.email || s.user_id)
      .join(', ')
    const currentUserSplit = (expense.splits || []).find((s) => s.user_id === currentUserId)
    const yourShare = currentUserSplit ? currentUserSplit.owed_amount.toFixed(2) : '0.00'

    return [date, description, category, amount, paidBy, splitBetween, yourShare]
      .map(escapeCsvField)
      .join(',')
  })

  return [headerRow, ...rows].join('\n')
}

/**
 * Creates a Blob from CSV content and triggers a browser download.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
