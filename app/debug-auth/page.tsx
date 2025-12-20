import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function DebugAuthPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  const allCookies = cookieStore.getAll()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">User:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {user ? JSON.stringify(user, null, 2) : 'No user'}
          </pre>
          {userError && (
            <p className="text-red-600">Error: {userError.message}</p>
          )}
        </div>

        <div>
          <h2 className="font-semibold">Session:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {session ? JSON.stringify({ access_token: session.access_token?.substring(0, 20) + '...', expires_at: session.expires_at }, null, 2) : 'No session'}
          </pre>
          {sessionError && (
            <p className="text-red-600">Error: {sessionError.message}</p>
          )}
        </div>

        <div>
          <h2 className="font-semibold">Cookies ({allCookies.length}):</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {allCookies.map(c => `${c.name}: ${c.value.substring(0, 20)}...`).join('\n')}
          </pre>
        </div>
      </div>
    </div>
  )
}

