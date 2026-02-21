import { createClient } from '@/lib/supabase/server'
import { getExpenseDetails } from '@/lib/services/expenses'
import { getGroupDetails } from '@/lib/services/groups'
import { redirect } from 'next/navigation'
import { EditExpensePageClient } from './page-client'

export default async function EditExpensePage({
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

  const [{ data: expense, error: expenseError }, { data: group }] = await Promise.all([
    getExpenseDetails(expenseId),
    getGroupDetails(groupId),
  ])

  if (expenseError || !expense) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Expense not found</p>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Group not found</p>
      </div>
    )
  }

  // Only the payer or admin can edit
  const isAdmin = group.members.find(m => m.user_id === user.id)?.role === 'admin'
  const canEdit = expense.paid_by === user.id || isAdmin

  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">You don&apos;t have permission to edit this expense.</p>
      </div>
    )
  }

  return (
    <EditExpensePageClient
      groupId={groupId}
      expense={expense}
      members={group.members}
      currentUserId={user.id}
    />
  )
}
