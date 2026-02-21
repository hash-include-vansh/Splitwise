'use client'

import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

export async function getNotifications(
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ data: Notification[] | null; error: Error | null }> {
  const supabase = createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error }
  }

  return { data: data as Notification[], error: null }
}

export async function markAsRead(
  notificationId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  return { error }
}

export async function markAllAsRead(
  userId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  return { error }
}

export async function getUnreadCount(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return { count: count || 0, error }
}

export async function createReminder(
  debtorId: string,
  creditorName: string,
  amount: number,
  groupId: string
): Promise<{ data: Notification | null; error: Error | null }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: debtorId,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      message: `${creditorName} is reminding you to pay ₹${amount.toFixed(2)}`,
      metadata: { groupId, amount, creditorName },
    })
    .select('*')
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data: data as Notification, error: null }
}

