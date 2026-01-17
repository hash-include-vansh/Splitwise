import { createClient } from '@/lib/supabase/client'

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient()
  
  // Build the callback URL with optional redirect parameter
  let callbackUrl = `${window.location.origin}/auth/callback`
  if (redirectTo) {
    callbackUrl += `?redirect=${encodeURIComponent(redirectTo)}`
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  })
  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  
  try {
    // First try the normal signOut
    const { error } = await supabase.auth.signOut()
    
    // Even if signOut fails, clear all Supabase cookies manually
    // This ensures the user is logged out even if the API call fails
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    })
    
    return { error }
  } catch (err) {
    // On any error, still clear cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      }
    })
    return { error: err as Error }
  }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

