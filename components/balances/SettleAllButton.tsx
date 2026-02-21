'use client'

import { useState } from 'react'
import { useBulkPayment } from '@/hooks/usePayments'
import { toast } from 'react-toastify'
import type { SimplifiedDebt, RawBalance } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { ArrowRight, X } from 'lucide-react'

interface SettleAllButtonProps {
  debts: (SimplifiedDebt | RawBalance)[]
  groupId: string
  currentUserId: string
}

export function SettleAllButton({ debts, groupId, currentUserId }: SettleAllButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const bulkPayment = useBulkPayment()

  // Filter debts where the current user is the debtor and not yet settled
  const myDebts = debts.filter(
    (d) => d.from_user_id === currentUserId && !d.isSettled && d.amount > 0.01
  )

  const totalOwed = myDebts.reduce((sum, d) => sum + d.amount, 0)

  if (myDebts.length === 0) return null

  const handleConfirm = async () => {
    const payments = myDebts.map((d) => ({
      debtor_id: d.from_user_id,
      creditor_id: d.to_user_id,
      amount: d.amount,
    }))

    try {
      await bulkPayment.mutateAsync({ groupId, payments })
      toast.success('All payments marked as paid! Waiting for confirmation.', {
        position: 'top-right',
        autoClose: 3000,
      })
      setShowModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to settle payments', {
        position: 'top-right',
        autoClose: 3000,
      })
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-xl border border-gray-900 dark:border-white bg-gray-900 dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-gray-900 shadow-elegant dark:shadow-none transition-all hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98]"
        style={{ letterSpacing: '-0.01em' }}
      >
        Settle All ({'\u20B9'}{totalOwed.toFixed(2)})
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3
                className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight"
                style={{ letterSpacing: '-0.02em' }}
              >
                Settle All Debts
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto px-6 py-4">
              <p className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                You are about to mark the following payments as paid:
              </p>
              <div className="space-y-3">
                {myDebts.map((debt, index) => {
                  const toUser = debt.to_user
                  return (
                    <div
                      key={`${debt.from_user_id}-${debt.to_user_id}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={toUser?.avatar_url}
                          alt={toUser?.name || 'User'}
                          name={toUser?.name}
                          email={toUser?.email}
                          size="sm"
                        />
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                          {toUser?.name || toUser?.email || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span
                          className="text-sm font-black text-gray-900 dark:text-gray-100 tracking-tight"
                          style={{ letterSpacing: '-0.02em' }}
                        >
                          {'\u20B9'}{debt.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Total</span>
                <span
                  className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {'\u20B9'}{totalOwed.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={bulkPayment.isPending}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={bulkPayment.isPending}
                  className="flex-1 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-bold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  {bulkPayment.isPending ? 'Settling...' : 'Confirm & Settle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
