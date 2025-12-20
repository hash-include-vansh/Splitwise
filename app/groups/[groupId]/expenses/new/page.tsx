import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewExpensePage({
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

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Group not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}/expenses`}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-3"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Expenses
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Expense</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Who's paying? Let's split it up!
        </p>
      </div>
      <div className="max-w-2xl">
        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 sm:p-8 shadow-xl">
          <ExpenseForm
            groupId={groupId}
            members={group.members}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  )
}

