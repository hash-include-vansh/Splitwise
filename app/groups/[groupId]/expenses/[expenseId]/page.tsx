import { createClient } from '@/lib/supabase/server'
import { getExpenseDetails } from '@/lib/services/expenses'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DeleteExpenseButton } from '@/components/expenses/DeleteExpenseButton'
import { Avatar } from '@/components/ui/Avatar'
import { getCategoryByKey } from '@/lib/constants/categories'
import { Pencil, User, Users } from 'lucide-react'

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>
}) {
  const { groupId, expenseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: expense, error } = await getExpenseDetails(expenseId)

  if (error || !expense) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200/60 dark:border-red-800/60 p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-3">Expense not found</p>
          <Link href={`/groups/${groupId}/expenses`} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-semibold transition-colors">
            Back to Expenses
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = expense.paid_by === user.id
  const canDelete = expense.paid_by === user.id
  const expenseCategory = getCategoryByKey(expense.category)
  const CategoryIcon = expenseCategory.icon

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}/expenses`}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Expenses
        </Link>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${expenseCategory.bgColor}`}>
              <CategoryIcon className={`h-6 w-6 ${expenseCategory.textColor}`} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{expense.description}</h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {expenseCategory.label} &bull; {new Date(expense.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href={`/groups/${groupId}/expenses/${expenseId}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all active:scale-95"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            )}
            {canDelete && (
              <DeleteExpenseButton expenseId={expenseId} groupId={groupId} />
            )}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xl dark:shadow-none">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <CategoryIcon className="h-4 w-4" />
              Amount
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              ₹{expense.amount.toFixed(2)}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <User className="h-4 w-4" />
              Paid by
            </div>
            <div className="mt-1 flex items-center gap-3">
              <Avatar
                src={expense.paid_by_user?.avatar_url}
                alt={expense.paid_by_user?.name || 'User'}
                name={expense.paid_by_user?.name}
                email={expense.paid_by_user?.email}
                size="md"
              />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {expense.paid_by_user?.name || expense.paid_by_user?.email || 'Unknown'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              <Users className="h-4 w-4" />
              Split among
            </div>
            <div className="space-y-2">
              {expense.splits?.map((split) => {
                const splitUser = split.user
                return (
                  <div
                    key={split.id}
                    className="flex items-center justify-between rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-md dark:shadow-none hover:shadow-lg hover:border-gray-500 dark:hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={splitUser?.avatar_url}
                        alt={splitUser?.name || 'User'}
                        name={splitUser?.name}
                        email={splitUser?.email}
                        size="sm"
                      />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {splitUser?.name || splitUser?.email || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      ₹{split.owed_amount.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

