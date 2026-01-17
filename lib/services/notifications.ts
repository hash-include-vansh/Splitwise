import { createClient } from '@/lib/supabase/server'
import type { Notification, NotificationType } from '@/lib/types'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<{ data: Notification | null; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    })
    .select('*')
    .single()

  if (error) {
    return { data: null, error }
  }

  return { data: data as Notification, error: null }
}

export async function getNotifications(
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{ data: Notification[] | null; error: Error | null }> {
  const supabase = await createClient()

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
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  return { error }
}

export async function markAllAsRead(
  userId: string
): Promise<{ error: Error | null }> {
  const supabase = await createClient()

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
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return { count: count || 0, error }
}

// Helper functions to create specific notification types
export async function notifyGroupCreated(
  userId: string,
  groupName: string,
  groupId: string
): Promise<void> {
  await createNotification(
    userId,
    'group_created',
    'Group Created',
    `You created the group "${groupName}"`,
    { groupId, groupName }
  )
}

export async function notifyGroupJoined(
  userId: string,
  groupName: string,
  groupId: string
): Promise<void> {
  await createNotification(
    userId,
    'group_joined',
    'Added to Group',
    `You were added to "${groupName}"`,
    { groupId, groupName }
  )
}

export async function notifyExpenseAdded(
  userId: string,
  expenseDescription: string,
  amount: number,
  groupName: string,
  groupId: string,
  expenseId: string
): Promise<void> {
  await createNotification(
    userId,
    'expense_added',
    'New Expense',
    `New expense: "${expenseDescription}" (₹${amount.toFixed(2)}) in "${groupName}"`,
    { groupId, groupName, expenseId, amount }
  )
}

export async function notifyPaymentPending(
  creditorId: string,
  debtorName: string,
  amount: number,
  groupId: string,
  paymentId: string
): Promise<void> {
  await createNotification(
    creditorId,
    'payment_pending',
    'Payment Marked',
    `${debtorName} marked a payment of ₹${amount.toFixed(2)} as paid. Please confirm.`,
    { groupId, paymentId, amount, debtorName }
  )
}

export async function notifyPaymentAccepted(
  debtorId: string,
  creditorName: string,
  amount: number,
  groupId: string,
  paymentId: string
): Promise<void> {
  await createNotification(
    debtorId,
    'payment_accepted',
    'Payment Accepted',
    `${creditorName} accepted your payment of ₹${amount.toFixed(2)}`,
    { groupId, paymentId, amount, creditorName }
  )
}

export async function notifyPaymentRejected(
  debtorId: string,
  creditorName: string,
  amount: number,
  groupId: string,
  paymentId: string
): Promise<void> {
  await createNotification(
    debtorId,
    'payment_rejected',
    'Payment Rejected',
    `${creditorName} rejected your payment of ₹${amount.toFixed(2)}`,
    { groupId, paymentId, amount, creditorName }
  )
}

export async function notifyFriendAdded(
  userId: string,
  friendName: string,
  friendId: string
): Promise<void> {
  await createNotification(
    userId,
    'friend_added',
    'New Friend',
    `${friendName} added you as a friend`,
    { friendId, friendName }
  )
}

