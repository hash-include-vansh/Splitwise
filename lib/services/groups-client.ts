'use client'

import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, GroupInvite } from '@/lib/types'
// Client-side service functions for groups (use browser Supabase client)

// Track emoji column availability to avoid repeated 400 errors.
// Starts as true (optimistic). Set to false on first emoji-related error.
// Once false, emoji is never sent again for the rest of the session.
let emojiColumnAvailable = true
let migrationAttempted = false

/** Mark emoji column as unavailable and trigger a server-side migration attempt */
function handleEmojiUnavailable() {
  emojiColumnAvailable = false
  if (migrationAttempted) return
  migrationAttempted = true
  fetch('/api/migrate', { method: 'POST' }).catch(() => {})
}

function generateInviteToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createGroup(name: string, userId: string, emoji?: string): Promise<{ data: Group | null; error: Error | null }> {
  const supabase = createClient()

  // Validate input
  if (!name || !name.trim()) {
    return { data: null, error: new Error('Group name is required') }
  }

  if (!userId) {
    return { data: null, error: new Error('User ID is required') }
  }

  try {
    // Only include emoji if the column is known to exist
    const insertData: Record<string, any> = { name: name.trim(), created_by: userId }
    if (emoji && emojiColumnAvailable) insertData.emoji = emoji

    let { data: group, error: groupError } = await supabase
      .from('groups')
      .insert(insertData)
      .select()
      .single()

    // If emoji column doesn't exist in DB, retry without it
    if (groupError && emoji && groupError.message?.includes('emoji')) {
      handleEmojiUnavailable()
      const { data: retryGroup, error: retryError } = await supabase
        .from('groups')
        .insert({ name: name.trim(), created_by: userId })
        .select()
        .single()
      group = retryGroup
      groupError = retryError
    }

    if (groupError) {
      console.error('Error creating group:', groupError)
      return {
        data: null,
        error: new Error(groupError.message || 'Failed to create group. Check RLS policies.')
      }
    }

    if (!group) {
      return { data: null, error: new Error('Group was not created') }
    }

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
      // Try to clean up the group if member insertion fails
      await supabase.from('groups').delete().eq('id', group.id)
      return {
        data: null,
        error: new Error(memberError.message || 'Failed to add you as group member')
      }
    }

    return { data: group as Group, error: null }
  } catch (err: any) {
    console.error('Unexpected error in createGroup:', err)
    return { data: null, error: new Error(err?.message || 'An unexpected error occurred') }
  }
}

export async function inviteMember(
  groupId: string,
  expiresInDays: number = 7
): Promise<{ data: GroupInvite | null; error: Error | null }> {
  const supabase = createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { data: null, error: new Error('Only group admins can create invites') }
  }
  
  // Generate unique token
  const inviteToken = generateInviteToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { data, error } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      invite_token: inviteToken,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data: data as GroupInvite, error: null }
}

export async function updateGroup(
  groupId: string,
  name: string,
  emoji?: string
): Promise<{ data: Group | null; error: Error | null }> {
  const supabase = createClient()

  // Validate input
  if (!name || !name.trim()) {
    return { data: null, error: new Error('Group name is required') }
  }

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return { data: null, error: new Error('Only admins can update group settings') }
  }

  // Only include emoji if the column is known to exist
  const updateData: Record<string, any> = { name: name.trim() }
  if (emoji !== undefined && emojiColumnAvailable) updateData.emoji = emoji

  let { data: group, error } = await supabase
    .from('groups')
    .update(updateData)
    .eq('id', groupId)
    .select()
    .single()

  // If emoji column doesn't exist in the database, retry without it
  if (error && emoji !== undefined && error.message?.includes('emoji')) {
    handleEmojiUnavailable()
    const { data: retryGroup, error: retryError } = await supabase
      .from('groups')
      .update({ name: name.trim() })
      .eq('id', groupId)
      .select()
      .single()
    group = retryGroup
    error = retryError
  }

  if (error) {
    console.error('Error updating group:', error)
    return { data: null, error: new Error(error.message || 'Failed to update group') }
  }

  return { data: group as Group, error: null }
}

export async function getUserGroups(userId: string): Promise<{ data: (Group & { created_by_user?: any })[] | null; error: Error | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups (
        *,
        created_by_user:users!groups_created_by_fkey (*)
      )
    `)
    .eq('user_id', userId)

  if (error) {
    return { data: null, error }
  }

  const groups = data?.map((item: any) => item.groups).filter(Boolean) || []
  return { data: groups, error: null }
}

export async function getGroupDetails(groupId: string): Promise<{ data: (Group & { members: GroupMember[] }) | null; error: Error | null }> {
  const supabase = createClient()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (groupError || !group) {
    return { data: null, error: groupError || new Error('Group not found') }
  }

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select(`
      *,
      user:users (*)
    `)
    .eq('group_id', groupId)

  if (membersError) {
    return { data: null, error: membersError }
  }

  return {
    data: {
      ...(group as Group),
      members: (members || []).map((m: any) => ({
        ...m,
        user: m.user,
      })) as GroupMember[],
    },
    error: null,
  }
}

export async function removeMember(
  groupId: string,
  userId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  // Check if requester is admin
  const { data: requesterMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', requesterId)
    .single()

  if (!requesterMember || requesterMember.role !== 'admin') {
    return { error: new Error('Only admins can remove members') }
  }

  // Remove member
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  return { error }
}

export async function leaveGroup(
  groupId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: new Error('Not authenticated') }
  }

  // Check user has no unsettled balances
  const { calculateRawBalances } = await import('@/lib/services/balances-client')
  const { data: rawBalances, error: balancesError } = await calculateRawBalances(groupId)

  if (balancesError) {
    return { error: new Error('Failed to check balances. Please try again.') }
  }

  if (rawBalances && rawBalances.length > 0) {
    const hasUnsettledBalances = rawBalances.some(
      (b) =>
        (b.from_user_id === user.id || b.to_user_id === user.id) &&
        !b.isSettled &&
        b.amount > 0.01
    )

    if (hasUnsettledBalances) {
      return { error: new Error('You have unsettled balances in this group. Please settle all debts before leaving.') }
    }
  }

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (membersError) {
    return { error: membersError }
  }

  if (!members || members.length === 0) {
    return { error: new Error('Group not found') }
  }

  const currentMember = members.find((m: any) => m.user_id === user.id)
  if (!currentMember) {
    return { error: new Error('You are not a member of this group') }
  }

  const isAdmin = currentMember.role === 'admin'
  const isLastMember = members.length === 1

  // If last member, delete the group entirely
  if (isLastMember) {
    const { error: deleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    return { error: deleteError }
  }

  // If admin leaving and is last admin, promote the longest-standing member
  if (isAdmin) {
    const admins = members.filter((m: any) => m.role === 'admin')
    if (admins.length === 1) {
      // Find the longest-standing non-admin member
      const nonAdminMembers = members.filter(
        (m: any) => m.user_id !== user.id && m.role !== 'admin'
      )

      if (nonAdminMembers.length > 0) {
        const { error: promoteError } = await supabase
          .from('group_members')
          .update({ role: 'admin' })
          .eq('id', nonAdminMembers[0].id)

        if (promoteError) {
          return { error: promoteError }
        }
      }
    }
  }

  // Delete the member row
  const { error: deleteError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  return { error: deleteError }
}

