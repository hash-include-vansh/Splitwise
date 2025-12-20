import { LoginButton } from '@/components/auth/LoginButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Expense Splitter</h1>
          <p className="mt-2 text-sm text-gray-600">
            Split expenses with friends, roommates, and travel groups
          </p>
        </div>
        <div className="mt-8">
          <LoginButton />
        </div>
      </div>
    </div>
  )
}

