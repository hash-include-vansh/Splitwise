'use client'

import { createBrowserClient } from '@supabase/ssr'

// 1 week in seconds (7 days * 24 hours * 60 minutes * 60 seconds)
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=')
            return { name: name.trim(), value: rest.join('=').trim() }
          }).filter(c => c.name)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set maxAge to 1 week for auth-related cookies if not already set
            // Supabase cookies typically include: sb-*, supabase.auth.token, etc.
            const isAuthCookie = name.includes('auth') || 
                                name.startsWith('sb-') || 
                                name.includes('supabase') ||
                                name.includes('token')
            const maxAge = options?.maxAge || (isAuthCookie ? ONE_WEEK_IN_SECONDS : undefined)
            
            document.cookie = `${name}=${value}; path=${options?.path || '/'}; ${
              maxAge ? `max-age=${maxAge}; ` : ''
            }${options?.domain ? `domain=${options.domain}; ` : ''}${
              options?.sameSite ? `samesite=${options.sameSite}; ` : ''
            }${options?.secure ? 'secure; ' : ''}`
          })
        },
      },
    }
  )
}
