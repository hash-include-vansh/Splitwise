import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'
import { redirect } from 'next/navigation'
import { NewExpensePageClient } from './page-client'

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
    <NewExpensePageClient
      groupId={groupId}
      members={group.members}
      currentUserId={user.id}
      groupName={group.name}
    />
  )
}
