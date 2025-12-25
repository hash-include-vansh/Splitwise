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
          {session ? (
            <div className="space-y-2">
              <pre className="bg-gray-100 p-2 rounded">
                {JSON.stringify({ 
                  access_token: session.access_token?.substring(0, 20) + '...', 
                  expires_at: session.expires_at,
                  expires_in: session.expires_in,
                  refresh_token: session.refresh_token ? session.refresh_token.substring(0, 20) + '...' : null,
                  token_type: session.token_type
                }, null, 2)}
              </pre>
              {session.expires_at && (
                <div className="text-sm">
                  <p className="font-semibold">Session Expiration:</p>
                  <p>Expires at: {new Date(session.expires_at * 1000).toLocaleString()}</p>
                  <p>Time until expiration: {Math.round((session.expires_at * 1000 - Date.now()) / 1000 / 60)} minutes</p>
                  {session.expires_in && (
                    <p>Expires in: {Math.round(session.expires_in / 60)} minutes</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <pre className="bg-gray-100 p-2 rounded">No session</pre>
          )}
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

