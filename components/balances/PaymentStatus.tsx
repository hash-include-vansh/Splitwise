'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/lib/types'
import {
  markPaymentAsPaid,
  acceptPayment,
  rejectPayment
} from '@/lib/services/payments-client'

interface PaymentStatusProps {
  groupId: string
  fromUserId: string  // debtor
  toUserId: string    // creditor
  amount: number
  currentUserId: string | null
  onPaymentUpdate?: () => void
}

export function PaymentStatus({
  groupId,
  fromUserId,
  toUserId,
  amount,
  currentUserId,
  onPaymentUpdate
}: PaymentStatusProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)

  const isDebtor = currentUserId === fromUserId
  const isCreditor = currentUserId === toUserId

  useEffect(() => {
    fetchPayments()
  }, [groupId, fromUserId, toUserId])

  async function fetchPayments() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('group_id', groupId)
        .eq('debtor_id', fromUserId)
        .eq('creditor_id', toUserId)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          setTableExists(false)
          setPayments([])
        } else {
          throw error
        }
      } else {
        setTableExists(true)
        setPayments(data || [])
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err)
      if (!err.message?.includes('does not exist')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAsPaid() {
    if (!currentUserId) return
    setActionLoading('mark-paid')
    setError(null)

    try {
      const { error } = await markPaymentAsPaid(groupId, fromUserId, toUserId, amount)
      if (error) throw error
      await fetchPayments()
      onPaymentUpdate?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAccept(paymentId: string) {
    setActionLoading(`accept-${paymentId}`)
    setError(null)

    try {
      const { error } = await acceptPayment(paymentId)
      if (error) throw error
      await fetchPayments()
      onPaymentUpdate?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(paymentId: string) {
    setActionLoading(`reject-${paymentId}`)
    setError(null)

    try {
      const { error } = await rejectPayment(paymentId)
      if (error) throw error
      await fetchPayments()
      onPaymentUpdate?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading payment status...</span>
        </div>
      </div>
    )
  }

  const pendingPayment = payments.find(p => p.status === 'pending')
  const acceptedPayments = payments.filter(p => p.status === 'accepted')
  const totalAccepted = acceptedPayments.reduce((sum, p) => sum + p.amount, 0)
  const remainingBalance = amount - totalAccepted

  return (
    <div className="mt-6 space-y-4">
      {!tableExists && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Payment tracking not set up yet. Run the latest schema.sql in your Supabase dashboard to enable this feature.
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Accepted Payments Summary */}
      {acceptedPayments.length > 0 && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Settled Payments</span>
          </div>
          <div className="space-y-2">
            {acceptedPayments.map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm text-green-800 dark:text-green-300">
                <span>
                  Paid on {new Date(payment.created_at).toLocaleDateString()}
                </span>
                <span className="font-bold">₹{payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700 flex justify-between font-bold text-green-800 dark:text-green-300">
            <span>Total Settled:</span>
            <span>₹{totalAccepted.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Pending Payment */}
      {pendingPayment && (
        <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 mb-3">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Pending Confirmation</span>
          </div>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
            Payment of <span className="font-bold">₹{pendingPayment.amount.toFixed(2)}</span> marked as paid.
            Waiting for confirmation.
          </p>

          {isCreditor && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(pendingPayment.id)}
                disabled={actionLoading !== null}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === `accept-${pendingPayment.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Accept
              </button>
              <button
                onClick={() => handleReject(pendingPayment.id)}
                disabled={actionLoading !== null}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === `reject-${pendingPayment.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject
              </button>
            </div>
          )}

          {isDebtor && (
            <p className="text-xs text-yellow-700 dark:text-yellow-400 italic">
              Waiting for the receiver to confirm this payment.
            </p>
          )}
        </div>
      )}

      {/* Mark as Paid Button */}
      {remainingBalance > 0.01 && !pendingPayment && (
        <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 shadow-elegant dark:shadow-none">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount to Pay:</span>
            <span className="text-xl font-black text-red-600 dark:text-red-400">₹{remainingBalance.toFixed(2)}</span>
          </div>

          {isDebtor ? (
            <button
              onClick={handleMarkAsPaid}
              disabled={actionLoading !== null || !tableExists}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-base font-bold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {actionLoading === 'mark-paid' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Mark as Paid
            </button>
          ) : isCreditor ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
              Waiting for the debtor to mark this as paid.
            </p>
          ) : currentUserId ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              Only the person who owes can mark this as paid.
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center py-2">
              Please log in to mark payments.
            </p>
          )}
        </div>
      )}

      {/* Fully Settled Message */}
      {remainingBalance <= 0.01 && (
        <div className="rounded-xl bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
          <p className="font-bold text-green-800 dark:text-green-300">Fully Settled!</p>
          <p className="text-sm text-green-700 dark:text-green-400">This balance has been completely paid off.</p>
        </div>
      )}
    </div>
  )
}
