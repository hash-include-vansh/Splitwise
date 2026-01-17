'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse all cookies from document.cookie
          const cookies: { name: string; value: string }[] = []
          if (typeof document !== 'undefined') {
            document.cookie.split(';').forEach(cookie => {
              const trimmed = cookie.trim()
              if (trimmed) {
                const eqIndex = trimmed.indexOf('=')
                if (eqIndex > 0) {
                  const name = trimmed.substring(0, eqIndex).trim()
                  const value = trimmed.substring(eqIndex + 1).trim()
                  if (name) {
                    cookies.push({ name, value })
                  }
                }
              }
            })
          }
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document !== 'undefined') {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookie = `${name}=${value}; path=${options?.path || '/'}`
              if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
              else cookie += '; max-age=604800' // 1 week default
              if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
              if (options?.secure) cookie += '; secure'
              document.cookie = cookie
            })
          }
        },
      },
    }
  )
}
