'use client'

import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, GroupInvite } from '@/lib/types'

function generateInviteToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createGroup(name: string, userId: string): Promise<{ data: Group | null; error: Error | null }> {
  const supabase = createClient()
  
  // Validate input
  if (!name || !name.trim()) {
    return { data: null, error: new Error('Group name is required') }
  }

  if (!userId) {
    return { data: null, error: new Error('User ID is required') }
  }

  try {
    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: userId })
      .select()
      .single()

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

