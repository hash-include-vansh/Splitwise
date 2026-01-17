'use client'

import { createClient } from '@/lib/supabase/client'
import type { Friendship, User } from '@/lib/types'

export async function addFriend(
  userId: string,
  friendId: string
): Promise<{ data: Friendship | null; error: Error | null }> {
  const supabase = createClient()

  // Normalize user IDs (smaller ID first) for consistency
  const user1_id = userId < friendId ? userId : friendId
  const user2_id = userId < friendId ? friendId : userId

  // Check if friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)
    .maybeSingle()

  if (existing) {
    return { data: existing as Friendship, error: null }
  }

  // Create new friendship
  const { data, error } = await supabase
    .from('friendships')
    .insert({ user1_id, user2_id })
    .select('*')
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data: data as Friendship, error: null }
}

export async function getFriends(
  userId: string
): Promise<{ data: User[] | null; error: Error | null }> {
  const supabase = createClient()

  // Get friendships where user is either user1 or user2
  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  if (friendshipsError) {
    return { data: null, error: friendshipsError }
  }

  // Extract friend IDs
  const friendIds = friendships?.map((f: any) => 
    f.user1_id === userId ? f.user2_id : f.user1_id
  ) || []

  if (friendIds.length === 0) {
    return { data: [], error: null }
  }

  // Fetch friend user details
  const { data: friends, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('id', friendIds)

  if (usersError) {
    return { data: null, error: usersError }
  }

  return { data: friends as User[], error: null }
}

export async function removeFriend(
  userId: string,
  friendId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  // Normalize user IDs
  const user1_id = userId < friendId ? userId : friendId
  const user2_id = userId < friendId ? friendId : userId

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)

  return { error }
}

export async function checkFriendship(
  userId: string,
  friendId: string
): Promise<{ isFriend: boolean; error: Error | null }> {
  const supabase = createClient()

  // Normalize user IDs
  const user1_id = userId < friendId ? userId : friendId
  const user2_id = userId < friendId ? friendId : userId

  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)
    .maybeSingle()

  if (error) {
    return { isFriend: false, error }
  }

  return { isFriend: !!data, error: null }
}

