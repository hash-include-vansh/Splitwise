import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'
import { redirect } from 'next/navigation'
import { ExpensesPageClient } from './page-client'

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

  // Fetch group details for the name
  const { data: group } = await getGroupDetails(groupId)

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Group not found</p>
      </div>
    )
  }

  return <ExpensesPageClient groupId={groupId} groupName={group.name} />
}

