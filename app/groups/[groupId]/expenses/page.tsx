import { createClient } from '@/lib/supabase/server'
import { getGroupDetails, getGroupMembers } from '@/lib/services/groups'
import { getGroupExpenses } from '@/lib/services/expenses'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: group } = await getGroupDetails(groupId)
  const { data: expenses } = await getGroupExpenses(groupId)

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Group not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/groups/${groupId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to {group.name}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Expenses</h1>
        </div>
        <Link
          href={`/groups/${groupId}/expenses/new`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Expense
        </Link>
      </div>
      <ExpenseList expenses={expenses || []} groupId={groupId} />
    </div>
  )
}

