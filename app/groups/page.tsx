import { createClient } from '@/lib/supabase/server'
import { getUserGroups } from '@/lib/services/groups'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { GroupListSkeleton } from '@/components/ui/Skeleton'
import { GroupsPageClient } from './GroupsPageClient'

// Prevent Next.js Router Cache from serving stale server component output
// when navigating back to /groups after updating a group on another page
export const dynamic = 'force-dynamic'

async function GroupsContent() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: groups } = await getUserGroups(user.id)

  return (
    <GroupsPageClient
      initialGroups={groups || []}
      currentUser={user}
    />
  )
}

export default async function GroupsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <Suspense fallback={
        <>
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="h-10 sm:h-12 w-40 sm:w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
            <div className="h-10 sm:h-12 w-28 sm:w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
          <GroupListSkeleton count={5} />
        </>
      }>
        <GroupsContent />
      </Suspense>
    </div>
  )
}
