import { createClient } from '@/lib/supabase/server'
import { getGroupDetails, removeMember } from '@/lib/services/groups'
import { GroupDetails } from '@/components/groups/GroupDetails'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  const { data: group } = await getGroupDetails(groupId)

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Group not found</p>
      </div>
    )
  }

  async function handleRemoveMember(userId: string) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    
    if (!currentUser) {
      throw new Error('Not authenticated')
    }
    
    await removeMember(groupId, userId, currentUser.id)
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Groups
      </Link>
      <GroupDetails
        group={group}
        currentUserId={user.id}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  )
}

