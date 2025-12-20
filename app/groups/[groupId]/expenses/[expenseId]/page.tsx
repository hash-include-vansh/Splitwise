import { createClient } from '@/lib/supabase/server'
import { getExpenseDetails } from '@/lib/services/expenses'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DeleteExpenseButton } from '@/components/expenses/DeleteExpenseButton'
import { Avatar } from '@/components/ui/Avatar'

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
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Expense not found</p>
        <Link href={`/groups/${groupId}/expenses`} className="text-blue-600 hover:underline">
          Back to Expenses
        </Link>
      </div>
    )
  }

  const canDelete = expense.paid_by === user.id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}/expenses`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Expenses
        </Link>
      </div>

      <div className="max-w-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{expense.description}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {new Date(expense.created_at).toLocaleDateString()}
            </p>
          </div>
          {canDelete && (
            <DeleteExpenseButton expenseId={expenseId} groupId={groupId} />
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="text-sm text-gray-500">Amount</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              ₹{expense.amount.toFixed(2)}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-500">Paid by</div>
            <div className="mt-1 flex items-center gap-2">
              <Avatar
                src={expense.paid_by_user?.avatar_url}
                alt={expense.paid_by_user?.name || 'User'}
                name={expense.paid_by_user?.name}
                email={expense.paid_by_user?.email}
                size="sm"
              />
              <span className="font-medium text-gray-900">
                {expense.paid_by_user?.name || expense.paid_by_user?.email || 'Unknown'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-3">Split among</div>
            <div className="space-y-2">
              {expense.splits?.map((split) => {
                const splitUser = split.user
                return (
                  <div
                    key={split.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={splitUser?.avatar_url}
                        alt={splitUser?.name || 'User'}
                        name={splitUser?.name}
                        email={splitUser?.email}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {splitUser?.name || splitUser?.email || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
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

