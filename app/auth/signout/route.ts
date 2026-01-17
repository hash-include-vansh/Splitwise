import { createServerClient } from '@supabase/ssr'
import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

async function handleSignOut(request: NextRequest) {
  const cookieStore = await cookies()
  
  // Create supabase client
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
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore errors in server components
          }
        },
      },
    }
  )

  // Sign out via Supabase
  await supabase.auth.signOut()

  // Get origin from request
  const origin = request.nextUrl.origin

  // Create response that redirects to login
  const response = NextResponse.redirect(new URL('/login', origin))

  // Delete ALL Supabase cookies by setting them to expire immediately
  // This works even for httpOnly cookies since we're on the server
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      })
    }
  })

  return response
}

export async function POST(request: NextRequest) {
  return handleSignOut(request)
}

// Also handle GET for direct navigation
export async function GET(request: NextRequest) {
  return handleSignOut(request)
}

