import { LoginButton } from '@/components/auth/LoginButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is already logged in, redirect to groups
  if (user) {
    redirect('/groups')
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-10 rounded-3xl bg-white p-10 sm:p-12 shadow-xl border border-gray-200/60">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 mb-6">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
            Splitwise
          </h1>
          <p className="text-base font-medium text-gray-600">
            Split expenses with friends, roommates, and travel groups
          </p>
        </div>
        <div>
          <LoginButton />
        </div>
      </div>
    </div>
  )
}

