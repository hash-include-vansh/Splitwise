import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { joinGroup } from '@/lib/services/groups'

// 1 week in seconds (7 days * 24 hours * 60 minutes * 60 seconds)
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect')
  const origin = requestUrl.origin
  const error = requestUrl.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin))
  }

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
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
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin)
      )
    }

    // Get the user for invite handling
    const { data: { user } } = await supabase.auth.getUser()

    // Determine the final redirect URL
    let finalRedirectUrl = '/groups'

    // Check if this is an invite link redirect - auto-join the group
    if (redirectTo && redirectTo.startsWith('/invite/') && user) {
      const inviteToken = redirectTo.replace('/invite/', '')
      
      try {
        const { data: group, error: joinError } = await joinGroup(inviteToken, user.id)
        
        if (group && !joinError) {
          // Successfully joined - redirect to the group
          finalRedirectUrl = `/groups/${group.id}`
        } else {
          // Join failed - still redirect to the invite page to show error
          finalRedirectUrl = redirectTo
        }
      } catch (err) {
        console.error('Error joining group from invite:', err)
        // On error, redirect to the original invite page
        finalRedirectUrl = redirectTo
      }
    } else if (redirectTo) {
      // For other redirects, just use the provided URL
      finalRedirectUrl = redirectTo
    }

    // Create redirect response
    const response = NextResponse.redirect(new URL(finalRedirectUrl, origin))
    
    // Ensure all cookies are copied to the response with proper maxAge settings
    cookieStore.getAll().forEach((cookie) => {
      const isSupabaseCookie = cookie.name.startsWith('sb-')
      const maxAge = isSupabaseCookie ? ONE_WEEK_IN_SECONDS : undefined
      
      response.cookies.set(cookie.name, cookie.value, {
        maxAge: maxAge,
        // IMPORTANT: Don't set httpOnly for Supabase cookies
        // The browser client needs to read them
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
    })

    return response
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}

