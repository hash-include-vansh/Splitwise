import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/services/groups'
import { GroupList } from '@/components/groups/GroupList'
import { CreateGroupButton } from '@/components/groups/CreateGroupButton'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: groups } = await getUserGroups(user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Groups</h1>
        <CreateGroupButton />
      </div>
      <GroupList groups={groups || []} />
    </div>
  )
}

