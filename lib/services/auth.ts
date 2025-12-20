import { createClient } from '@/lib/supabase/client'

export async function signInWithGoogle() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
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

