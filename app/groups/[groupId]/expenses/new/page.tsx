import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { redirect } from 'next/navigation'

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Add New Expense</h1>
      <div className="max-w-2xl">
        <ExpenseForm
          groupId={groupId}
          members={group.members}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}

