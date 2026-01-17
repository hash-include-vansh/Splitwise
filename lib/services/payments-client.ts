import type { Payment } from '@/lib/types'

export async function markPaymentAsPaid(
  groupId: string,
  debtorId: string,
  creditorId: string,
  amount: number
): Promise<{ data: Payment | null; error: Error | null }> {
  const response = await fetch('/api/payments/mark-paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, debtorId, creditorId, amount }),
  })

  if (!response.ok) {
    const error = await response.json()
    return { data: null, error: new Error(error.message || 'Failed to mark payment as paid') }
  }

  const data = await response.json()
  return { data: data.payment, error: null }
}

export async function acceptPayment(paymentId: string): Promise<{ data: Payment | null; error: Error | null }> {
  const response = await fetch(`/api/payments/${paymentId}/accept`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    return { data: null, error: new Error(error.message || 'Failed to accept payment') }
  }

  const data = await response.json()
  return { data: data.payment, error: null }
}

export async function rejectPayment(paymentId: string): Promise<{ data: Payment | null; error: Error | null }> {
  const response = await fetch(`/api/payments/${paymentId}/reject`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    return { data: null, error: new Error(error.message || 'Failed to reject payment') }
  }

  const data = await response.json()
  return { data: data.payment, error: null }
}

