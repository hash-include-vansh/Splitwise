import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'
import { redirect } from 'next/navigation'
import { AnalyticsPageClient } from './page-client'
import Link from 'next/link'

// Force dynamic rendering - no caching, always fetch from database
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsPage({
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
        <p className="text-gray-500 dark:text-gray-400">Group not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {group.name}
        </Link>
      </div>
      <AnalyticsPageClient groupId={groupId} groupName={group.name} />
    </div>
  )
}
