import { createClient } from '@/lib/supabase/server'
import { joinGroup } from '@/lib/services/groups'
import { redirect } from 'next/navigation'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/invite/${token}`)
  }

  const { data: group, error } = await joinGroup(token, user.id)

  if (error || !group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Invite</h1>
          <p className="mt-2 text-gray-600">
            {error?.message || 'This invite link is invalid or has expired.'}
          </p>
          <a
            href="/groups"
            className="mt-4 inline-block rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
          >
            Go to Groups
          </a>
        </div>
      </div>
    )
  }

  redirect(`/groups/${group.id}`)
}

