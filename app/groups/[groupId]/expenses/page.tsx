import { createClient } from '@/lib/supabase/server'
import { getGroupDetails, getGroupMembers } from '@/lib/services/groups'
import { getGroupExpenses } from '@/lib/services/expenses'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExpenseListSkeleton } from '@/components/ui/Skeleton'

// Force dynamic rendering - no caching, always fetch from database
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // Always fetch fresh data from database - no caching
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {group.name}
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              {expenses?.length || 0} {expenses?.length === 1 ? 'expense' : 'expenses'}
            </p>
          </div>
          <Link
            href={`/groups/${groupId}/expenses/new`}
            className="group flex items-center gap-2 sm:gap-3 rounded-xl bg-black px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-elegant hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>
      <ExpenseList expenses={expenses || []} groupId={groupId} />
    </div>
  )
}

