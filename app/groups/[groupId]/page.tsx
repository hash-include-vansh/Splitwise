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
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/groups"
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Groups
      </Link>
      <GroupDetails
        group={group}
        currentUserId={user.id}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  )
}

