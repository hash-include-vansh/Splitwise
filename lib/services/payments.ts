import { createClient } from '@/lib/supabase/server'
import type { Payment } from '@/lib/types'

export async function markPaymentAsPaid(
  groupId: string,
  debtorId: string,
  creditorId: string,
  amount: number,
  markedBy: string
): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = await createClient()

  // Check if payment already exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('*')
    .eq('group_id', groupId)
    .eq('debtor_id', debtorId)
    .eq('creditor_id', creditorId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingPayment) {
    return { data: null, error: new Error('A pending payment already exists for this balance') }
  }

  // Create new payment
  const { data, error } = await supabase
    .from('payments')
    .insert({
      group_id: groupId,
      debtor_id: debtorId,
      creditor_id: creditorId,
      amount,
      status: 'pending',
      marked_by: markedBy,
    })
    .select(`
      *,
      debtor:debtor_id(id, name, email, avatar_url),
      creditor:creditor_id(id, name, email, avatar_url),
      marked_by_user:marked_by(id, name, email, avatar_url),
      accepted_by_user:accepted_by(id, name, email, avatar_url)
    `)
    .single()

  if (error || !data) {
    return { data: null, error: error || new Error('Failed to create payment') }
  }

  return { data: data as Payment, error: null }
}

export async function acceptPayment(
  paymentId: string,
  acceptedBy: string
): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = await createClient()

  // Update payment status to accepted
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'accepted',
      accepted_by: acceptedBy,
    })
    .eq('id', paymentId)
    .select(`
      *,
      debtor:debtor_id(id, name, email, avatar_url),
      creditor:creditor_id(id, name, email, avatar_url),
      marked_by_user:marked_by(id, name, email, avatar_url),
      accepted_by_user:accepted_by(id, name, email, avatar_url)
    `)
    .single()

  if (error || !data) {
    return { data: null, error: error || new Error('Failed to accept payment') }
  }

  return { data: data as Payment, error: null }
}

export async function rejectPayment(
  paymentId: string
): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = await createClient()

  // Update payment status to rejected
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
    })
    .eq('id', paymentId)
    .select(`
      *,
      debtor:debtor_id(id, name, email, avatar_url),
      creditor:creditor_id(id, name, email, avatar_url),
      marked_by_user:marked_by(id, name, email, avatar_url),
      accepted_by_user:accepted_by(id, name, email, avatar_url)
    `)
    .single()

  if (error || !data) {
    return { data: null, error: error || new Error('Failed to reject payment') }
  }

  return { data: data as Payment, error: null }
}

export async function getPayments(
  groupId: string
): Promise<{ data: Payment[] | null; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      debtor:debtor_id(id, name, email, avatar_url),
      creditor:creditor_id(id, name, email, avatar_url),
      marked_by_user:marked_by(id, name, email, avatar_url),
      accepted_by_user:accepted_by(id, name, email, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error }
  }

  return { data: data as Payment[], error: null }
}

export async function getUserPayments(
  userId: string,
  groupId?: string
): Promise<{ data: Payment[] | null; error: Error | null }> {
  const supabase = await createClient()

  let query = supabase
    .from('payments')
    .select(`
      *,
      debtor:debtor_id(id, name, email, avatar_url),
      creditor:creditor_id(id, name, email, avatar_url),
      marked_by_user:marked_by(id, name, email, avatar_url),
      accepted_by_user:accepted_by(id, name, email, avatar_url)
    `)
    .or(`debtor_id.eq.${userId},creditor_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (groupId) {
    query = query.eq('group_id', groupId)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error }
  }

  return { data: data as Payment[], error: null }
}

export async function getPaymentById(paymentId: string): Promise<{ data: Payment | null; error: Error | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      debtor:debtor_id(id, name, email, avatar_url),
      creditor:creditor_id(id, name, email, avatar_url),
      marked_by_user:marked_by(id, name, email, avatar_url),
      accepted_by_user:accepted_by(id, name, email, avatar_url)
    `)
    .eq('id', paymentId)
    .single()

  if (error || !data) {
    return { data: null, error: error || new Error('Payment not found') }
  }

  return { data: data as Payment, error: null }
}

