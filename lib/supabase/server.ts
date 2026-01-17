import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 1 week in seconds (7 days * 24 hours * 60 minutes * 60 seconds)
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Supabase SSR uses cookies starting with 'sb-' followed by project ref
              // Set maxAge to 1 week for ALL Supabase cookies
              const isSupabaseCookie = name.startsWith('sb-')
              const maxAge = isSupabaseCookie ? ONE_WEEK_IN_SECONDS : options?.maxAge
              
              cookieStore.set(name, value, {
                ...options,
                maxAge: maxAge,
                // IMPORTANT: Don't set httpOnly for Supabase cookies
                // The browser client needs to read them
                httpOnly: false,
                sameSite: options?.sameSite ?? 'lax',
                secure: options?.secure ?? process.env.NODE_ENV === 'production',
              })
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

