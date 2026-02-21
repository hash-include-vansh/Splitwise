'use client'

import { createClient } from '@/lib/supabase/client'
import type { Payment, Notification } from '@/lib/types'

export interface BulkPaymentItem {
  debtor_id: string
  creditor_id: string
  amount: number
}

export async function createBulkPayments(
  groupId: string,
  payments: BulkPaymentItem[]
): Promise<{ data: Payment[] | null; error: Error | null }> {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  try {
    // Insert all payments
    const paymentRows = payments.map((p) => ({
      group_id: groupId,
      debtor_id: p.debtor_id,
      creditor_id: p.creditor_id,
      amount: p.amount,
      status: 'pending' as const,
      marked_by: user.id,
    }))

    const { data, error } = await supabase
      .from('payments')
      .insert(paymentRows)
      .select('*')

    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to create bulk payments') }
    }

    return { data: data as Payment[], error: null }
  } catch (err: any) {
    return { data: null, error: new Error(err?.message || 'Failed to create bulk payments') }
  }
}

export async function sendPaymentReminder(
  groupId: string,
  debtorId: string,
  creditorId: string,
  amount: number
): Promise<{ data: Notification | null; error: Error | null }> {
  const supabase = createClient()

  // Get current user info for the reminder message
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  // Get creditor's name
  const { data: creditorUser } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', creditorId)
    .single()

  const creditorName = creditorUser?.name || creditorUser?.email || 'Someone'

  // Create notification for the debtor
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: debtorId,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      message: `${creditorName} is reminding you to pay ₹${amount.toFixed(2)}`,
      metadata: { groupId, amount, creditorName, creditorId },
    })
    .select('*')
    .single()

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to send reminder') }
  }

  return { data: data as Notification, error: null }
}

export async function markPaymentAsPaid(
  groupId: string,
  debtorId: string,
  creditorId: string,
  amount: number
): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      group_id: groupId,
      debtor_id: debtorId,
      creditor_id: creditorId,
      amount,
      status: 'pending',
      marked_by: user.id,
    })
    .select('*')
    .single()

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to mark payment as paid') }
  }

  return { data: data as Payment, error: null }
}

export async function acceptPayment(paymentId: string): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'accepted', accepted_by: user.id })
    .eq('id', paymentId)
    .select('*')
    .single()

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to accept payment') }
  }

  return { data: data as Payment, error: null }
}

export async function rejectPayment(paymentId: string): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'rejected', accepted_by: user.id })
    .eq('id', paymentId)
    .select('*')
    .single()

  if (error) {
    return { data: null, error: new Error(error.message || 'Failed to reject payment') }
  }

  return { data: data as Payment, error: null }
}
