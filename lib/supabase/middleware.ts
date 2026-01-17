import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 1 week in seconds (7 days * 24 hours * 60 minutes * 60 seconds)
const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Create a new response for each setAll call to ensure cookies are properly set
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) => {
            // Supabase SSR uses cookies starting with 'sb-' followed by project ref
            // Set maxAge to 1 week for ALL Supabase cookies (they all start with 'sb-')
            const isSupabaseCookie = name.startsWith('sb-')
            const maxAge = isSupabaseCookie ? ONE_WEEK_IN_SECONDS : options?.maxAge
            
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: maxAge,
              // IMPORTANT: Don't set httpOnly for Supabase cookies
              // The browser client needs to read them
              httpOnly: false,
              sameSite: options?.sameSite ?? 'lax',
              secure: options?.secure ?? process.env.NODE_ENV === 'production',
            })
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // getUser() automatically refreshes the session if needed
  // This call will trigger setAll if the session needs to be refreshed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users away from login page
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/groups'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login (except for login and auth pages)
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  // Prevent browser from caching authenticated pages
  // This ensures cookies are sent fresh on every request
  supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  supabaseResponse.headers.set('Pragma', 'no-cache')
  supabaseResponse.headers.set('Expires', '0')

  return supabaseResponse
}

