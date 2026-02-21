import { createClient } from '@/lib/supabase/server'
import type { Group, GroupMember, GroupInvite } from '@/lib/types'

function generateInviteToken(): string {
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(array)
  } else {
    // Server-side: use Node.js crypto
    const crypto = require('crypto')
    crypto.randomFillSync(array)
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createGroup(name: string, userId: string): Promise<{ data: Group | null; error: Error | null }> {
  const supabase = await createClient()
  
  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, created_by: userId })
    .select()
    .single()

  if (groupError || !group) {
    return { data: null, error: groupError || new Error('Failed to create group') }
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
    return { data: null, error: memberError }
  }

  return { data: group as Group, error: null }
}

export async function getUserGroups(userId: string): Promise<{ data: (Group & { created_by_user?: any })[] | null; error: Error | null }> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()
  
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

export async function inviteMember(
  groupId: string,
  expiresInDays: number = 7
): Promise<{ data: GroupInvite | null; error: Error | null }> {
  const supabase = await createClient()
  
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

export async function joinGroup(
  inviteToken: string,
  userId: string
): Promise<{ data: Group | null; error: Error | null }> {
  const supabase = await createClient()
  
  // Validate invite
  const { data: invite, error: inviteError } = await supabase
    .from('group_invites')
    .select('*, groups (*)')
    .eq('invite_token', inviteToken)
    .single()

  if (inviteError || !invite) {
    return { data: null, error: inviteError || new Error('Invalid invite token') }
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return { data: null, error: new Error('Invite has expired') }
  }

  // Check if already member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', invite.group_id)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    return { data: (invite.groups as any) as Group, error: null }
  }

  // Add as member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: invite.group_id,
      user_id: userId,
      role: 'member',
    })

  if (memberError) {
    return { data: null, error: memberError }
  }

  return { data: (invite.groups as any) as Group, error: null }
}

export async function removeMember(
  groupId: string,
  userId: string,
  requesterId: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient()
  
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

export async function updateGroup(
  groupId: string,
  name: string,
  requesterId: string
): Promise<{ data: Group | null; error: Error | null }> {
  const supabase = await createClient()

  // Check if requester is admin
  const { data: requesterMember } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', requesterId)
    .single()

  if (!requesterMember || requesterMember.role !== 'admin') {
    return { data: null, error: new Error('Only admins can update group settings') }
  }

  const { data: group, error } = await supabase
    .from('groups')
    .update({ name: name.trim() })
    .eq('id', groupId)
    .select()
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data: group as Group, error: null }
}

export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient()

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

  const currentMember = members.find((m: any) => m.user_id === userId)
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
        (m: any) => m.user_id !== userId && m.role !== 'admin'
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
    .eq('user_id', userId)

  return { error: deleteError }
}

export async function getGroupMembers(groupId: string): Promise<{ data: GroupMember[] | null; error: Error | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      user:users (*)
    `)
    .eq('group_id', groupId)

  if (error) {
    return { data: null, error }
  }

  return {
    data: (data || []).map((m: any) => ({
      ...m,
      user: m.user,
    })) as GroupMember[],
    error: null,
  }
}

