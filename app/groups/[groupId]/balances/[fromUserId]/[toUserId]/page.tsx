'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PaymentStatus } from '@/components/balances/PaymentStatus'
import { SimplificationExplainer } from '@/components/balances/SimplificationExplainer'

interface BalanceContribution {
  expense: Expense
  contribution: number // Positive = increases debt (from_user owes more), Negative = decreases debt
}

export default function BalanceDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const groupId = params.groupId as string
  const fromUserId = params.fromUserId as string
  const toUserId = params.toUserId as string
  
  // Get the expected amount from URL (from simplified/raw balance view)
  const urlAmount = searchParams.get('amount')
  const expectedAmount = urlAmount ? parseFloat(urlAmount) : null

  const [contributions, setContributions] = useState<BalanceContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromUser, setFromUser] = useState<any>(null)
  const [toUser, setToUser] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Get current user from server API (more reliable than client-side cookies)
        const userResponse = await fetch('/api/user')
        const userData = await userResponse.json()
        setCurrentUserId(userData.user?.id || null)

        // Get user details
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .in('id', [fromUserId, toUserId])

        const fromUserData = users?.find(u => u.id === fromUserId)
        const toUserData = users?.find(u => u.id === toUserId)
        setFromUser(fromUserData)
        setToUser(toUserData)

        // Get all expenses for this group
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            *,
            splits:expense_splits (
              *,
              user:users (*)
            )
          `)
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
        // Balance: from_user owes to_user
        // Positive contribution = from_user owes more (increases debt)
        // Negative contribution = to_user owes from_user (decreases debt)
        const contributionsList: BalanceContribution[] = []
        let total = 0

        expenses?.forEach((expense: any) => {
          const payerId = expense.paid_by
          const splits = expense.splits || []

          // Find splits for both users
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
            const contribution = -toUserSplit.owed_amount // Negative because it reduces the debt
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
        contributionsList.sort((a, b) => 
          new Date(b.expense.created_at).getTime() - new Date(a.expense.created_at).getTime()
        )

        setContributions(contributionsList)
        setTotalAmount(total) // Store actual total (positive = from_user owes to_user)
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
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  const fromUserName = fromUser?.name || fromUser?.email || 'Unknown'
  const toUserName = toUser?.name || toUser?.email || 'Unknown'

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
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            Balance Breakdown
          </h1>
          <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">
            <span className="font-bold text-gray-900">{fromUserName}</span> owes{' '}
            <span className="font-bold text-gray-900">{toUserName}</span>
          </p>
          <p className="text-2xl font-black text-red-600">
            ₹{(expectedAmount ?? Math.abs(totalAmount)).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Visual explanation of debt simplification */}
      {expectedAmount && Math.abs(expectedAmount - Math.abs(totalAmount)) > 0.01 && (
        <SimplificationExplainer
          groupId={groupId}
          fromUserId={fromUserId}
          toUserId={toUserId}
          simplifiedAmount={expectedAmount}
          rawAmount={Math.abs(totalAmount)}
        />
      )}

      {/* Table - Direct Expenses */}
      {contributions.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-gray-500">No expenses found for this balance.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-elegant overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700">📋 Direct Expenses Between {fromUserName} & {toUserName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">These are the actual expenses where one paid and the other owes</p>
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
                  <th className="text-left py-2.5 px-2 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {fromUserName}&apos;s Share
                  </th>
                  <th className="text-right py-2.5 px-2 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Owes
                  </th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((item, index) => {
                  const isDebtIncrease = item.contribution > 0
                  
                  // Show who paid
                  const paidByName = item.expense.paid_by_user?.name || item.expense.paid_by_user?.email || 'Unknown'
                  
                  // For the share column - show what fromUser's share was in this expense
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
                      <td className="py-2.5 px-2">
                        <div className="text-[10px] sm:text-xs font-semibold text-gray-900">
                          ₹{shareAmount.toFixed(2)}
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
                  <td colSpan={4} className="py-3 px-2 text-right text-xs sm:text-sm font-bold text-gray-900">
                    Net Balance:
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`text-xs sm:text-base md:text-lg font-black whitespace-nowrap ${totalAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Math.abs(totalAmount).toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Payment Status and Actions */}
      {(expectedAmount ?? Math.abs(totalAmount)) > 0.01 && (
        <PaymentStatus
          groupId={groupId}
          fromUserId={fromUserId}
          toUserId={toUserId}
          amount={expectedAmount ?? Math.abs(totalAmount)}
          currentUserId={currentUserId}
          onPaymentUpdate={() => {
            // Refresh the page data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
