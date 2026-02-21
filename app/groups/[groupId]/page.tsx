import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { GroupListSkeleton } from '@/components/ui/Skeleton'
import { GroupDetailClient } from './GroupDetailClient'

// Prevent Next.js Router Cache from serving stale server component output
export const dynamic = 'force-dynamic'

async function GroupDetailContent({ groupId, userId }: { groupId: string; userId: string }) {
  const { data: group } = await getGroupDetails(groupId)

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500 dark:text-gray-500">Group not found</p>
      </div>
    )
  }

  return (
    <GroupDetailClient
      initialGroup={group}
      currentUserId={userId}
    />
  )
}

export default async function GroupDetailPage({
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

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Groups
      </Link>
      <Suspense fallback={
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 p-5">
              <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="flex-1 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 p-5">
              <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
          <GroupListSkeleton count={3} />
        </div>
      }>
        <GroupDetailContent groupId={groupId} userId={user.id} />
      </Suspense>
    </div>
  )
}

