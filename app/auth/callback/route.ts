import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 1 week in seconds (7 days * 24 hours * 60 minutes * 60 seconds)
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
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
                  httpOnly: options?.httpOnly ?? true,
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

    // Create redirect response
    const response = NextResponse.redirect(new URL('/groups', origin))
    
    // Ensure all cookies are copied to the response with proper maxAge settings
    cookieStore.getAll().forEach((cookie) => {
      const isSupabaseCookie = cookie.name.startsWith('sb-')
      const maxAge = isSupabaseCookie ? ONE_WEEK_IN_SECONDS : undefined
      
      response.cookies.set(cookie.name, cookie.value, {
        maxAge: maxAge,
        httpOnly: true,
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

