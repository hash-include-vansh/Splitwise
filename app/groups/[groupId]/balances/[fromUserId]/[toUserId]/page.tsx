'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PaymentStatus } from '@/components/balances/PaymentStatus'

interface BalanceContribution {
  expense: Expense
  contribution: number // Positive = increases debt (from_user owes more), Negative = decreases debt
}

export default function BalanceDetailPage() {
  const params = useParams()
  const groupId = params.groupId as string
  const fromUserId = params.fromUserId as string
  const toUserId = params.toUserId as string

  const [contributions, setContributions] = useState<BalanceContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromUser, setFromUser] = useState<any>(null)
  const [toUser, setToUser] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [rawTotal, setRawTotal] = useState(0) // Raw total from direct expenses (before payments)
  const [paidTotal, setPaidTotal] = useState(0) // Total accepted payments

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Get current user
        const userResponse = await fetch('/api/user')
        const userData = await userResponse.json()
        setCurrentUserId(userData.user?.id || null)

        // Get user details
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .in('id', [fromUserId, toUserId])

        const fromUserData = users?.find((u) => u.id === fromUserId)
        const toUserData = users?.find((u) => u.id === toUserId)
        setFromUser(fromUserData)
        setToUser(toUserData)

        // Get all expenses for this group
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select(
            `
            *,
            splits:expense_splits (
              *,
              user:users (*)
            )
          `
          )
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })

        if (expensesError) {
          setError(expensesError.message)
          return
        }

        // Get paid_by users
        const userIds = new Set<string>()
        expenses?.forEach((exp: any) => {
          userIds.add(exp.paid_by)
        })

        const { data: paidByUsers } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds))

        const userMap = new Map(paidByUsers?.map((u: any) => [u.id, u]) || [])

        // Calculate contributions
        const contributionsList: BalanceContribution[] = []
        let total = 0

        expenses?.forEach((expense: any) => {
          const payerId = expense.paid_by
          const splits = expense.splits || []

          const fromUserSplit = splits.find((s: any) => s.user_id === fromUserId)
          const toUserSplit = splits.find((s: any) => s.user_id === toUserId)

          // Case 1: to_user paid, from_user owes (increases debt)
          if (payerId === toUserId && fromUserSplit) {
            const contribution = fromUserSplit.owed_amount
            if (contribution > 0.01) {
              total += contribution
              contributionsList.push({
                expense: {
                  ...expense,
                  paid_by_user: userMap.get(expense.paid_by) || undefined,
                  splits: splits.map((s: any) => ({
                    ...s,
                    user: s.user || undefined,
                  })),
                } as Expense,
                contribution,
              })
            }
          }

          // Case 2: from_user paid, to_user owes (decreases debt)
          if (payerId === fromUserId && toUserSplit) {
            const contribution = -toUserSplit.owed_amount
            if (Math.abs(contribution) > 0.01) {
              total += contribution
              contributionsList.push({
                expense: {
                  ...expense,
                  paid_by_user: userMap.get(expense.paid_by) || undefined,
                  splits: splits.map((s: any) => ({
                    ...s,
                    user: s.user || undefined,
                  })),
                } as Expense,
                contribution,
              })
            }
          }
        })

        // Sort by date (newest first)
        contributionsList.sort(
          (a, b) =>
            new Date(b.expense.created_at).getTime() - new Date(a.expense.created_at).getTime()
        )

        // Get accepted payments
        let paid = 0
        try {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('group_id', groupId)
            .eq('debtor_id', fromUserId)
            .eq('creditor_id', toUserId)
            .eq('status', 'accepted')

          if (payments) {
            paid = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
          }
        } catch {
          // payments table may not exist
        }

        setContributions(contributionsList)
        setRawTotal(Math.max(0, total)) // Raw balance from expenses
        setPaidTotal(paid)
      } catch (err: any) {
        setError(err?.message || 'Failed to load balance details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId, fromUserId, toUserId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800"></div>
            <p className="mt-4 text-sm text-gray-500">Loading balance details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>
      </div>
    )
  }

  const fromUserName = fromUser?.name || fromUser?.email || 'Unknown'
  const toUserName = toUser?.name || toUser?.email || 'Unknown'
  const remainingBalance = Math.max(0, rawTotal - paidTotal)
  const isFullySettled = remainingBalance <= 0.01 && paidTotal > 0.01

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}/balances`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Balances
        </Link>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            Balance Details
          </h1>
          <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">
            <span className="font-bold text-gray-900">{fromUserName}</span>
            {isFullySettled ? ' settled with ' : ' owes '}
            <span className="font-bold text-gray-900">{toUserName}</span>
          </p>

          {/* Summary card */}
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-elegant">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>From expenses</span>
              <span className="font-bold text-gray-900">₹{rawTotal.toFixed(2)}</span>
            </div>
            {paidTotal > 0.01 && (
              <div className="flex items-center justify-between text-sm text-green-700 mb-1">
                <span>Payments made</span>
                <span className="font-bold">-₹{paidTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">
                {isFullySettled ? 'Settled' : 'Remaining'}
              </span>
              <span
                className={`text-xl font-black ${isFullySettled ? 'text-green-600' : 'text-red-600'}`}
              >
                ₹{remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table - Direct Expenses */}
      {contributions.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-gray-500">No direct expenses found between these two people.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-elegant overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">
              Expenses between {fromUserName} & {toUserName}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-2.5 px-2 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left py-2.5 px-2 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="text-left py-2.5 px-2 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Paid By
                  </th>
                  <th className="text-right py-2.5 px-2 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Effect on Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((item, index) => {
                  const isDebtIncrease = item.contribution > 0
                  const paidByName =
                    item.expense.paid_by_user?.name ||
                    item.expense.paid_by_user?.email ||
                    'Unknown'
                  const shareAmount = Math.abs(item.contribution)

                  return (
                    <tr
                      key={`${item.expense.id}-${index}`}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-2.5 px-2 text-[10px] sm:text-xs font-medium text-gray-600 whitespace-nowrap">
                        {new Date(item.expense.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-gray-900 text-[10px] sm:text-xs mb-0.5">
                          {item.expense.description}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500">
                          Total: ₹{item.expense.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="text-[10px] sm:text-xs font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none">
                          {paidByName}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {isDebtIncrease ? (
                          <span className="text-xs sm:text-sm font-bold text-red-600 whitespace-nowrap">
                            +₹{shareAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-green-600 whitespace-nowrap">
                            -₹{shareAmount.toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 bg-gray-100">
                  <td
                    colSpan={3}
                    className="py-3 px-2 text-right text-xs sm:text-sm font-bold text-gray-900"
                  >
                    Balance from Expenses:
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span
                      className={`text-xs sm:text-base md:text-lg font-black whitespace-nowrap ${rawTotal > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      ₹{rawTotal.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Payment Status and Actions */}
      {rawTotal > 0.01 && (
        <PaymentStatus
          groupId={groupId}
          fromUserId={fromUserId}
          toUserId={toUserId}
          amount={rawTotal}
          currentUserId={currentUserId}
          onPaymentUpdate={() => {
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
