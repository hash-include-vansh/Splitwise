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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            My Groups
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            {groups?.length || 0} {groups?.length === 1 ? 'group' : 'groups'}
          </p>
        </div>
        <CreateGroupButton />
      </div>
      <GroupList groups={groups || []} />
    </div>
  )
}

