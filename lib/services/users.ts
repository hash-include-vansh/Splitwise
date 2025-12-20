import { createClient } from '@/lib/supabase/server'
import type { User } from '@/lib/types'

export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as User
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'avatar_url'>>
): Promise<{ error: Error | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)

  return { error }
}

