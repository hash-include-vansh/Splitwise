'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { RawBalance } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { SettleAllButton } from '@/components/balances/SettleAllButton'
import { RemindButton } from '@/components/balances/RemindButton'

interface RawBalanceViewProps {
  balances: RawBalance[]
  currentUserId?: string
  groupId: string
}

function BalanceRow({
  balance,
  isClickable,
  onClick,
}: {
  balance: RawBalance
  isClickable: boolean
  onClick?: () => void
}) {
  const fromUser = balance.from_user
  const toUser = balance.to_user
  const isSettled = balance.isSettled || false
  const hasPaidAmount = (balance.paidAmount || 0) > 0 && !isSettled

  const containerClass = isSettled
    ? 'w-full text-left rounded-xl border-2 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 shadow-elegant'
    : hasPaidAmount
      ? `w-full text-left rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 shadow-elegant${isClickable ? ' transition-all hover:shadow-medium hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer active:scale-[0.98]' : ''}`
      : `w-full text-left rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 shadow-elegant${isClickable ? ' transition-all hover:shadow-medium hover:border-gray-300/60 dark:hover:border-gray-600/60 cursor-pointer active:scale-[0.98]' : ''}`

  const content = (
    <>
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isSettled && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
          <Avatar
            src={fromUser?.avatar_url}
            alt={fromUser?.name || 'User'}
            name={fromUser?.name}
            email={fromUser?.email}
            size="sm"
          />
          <div className="min-w-0">
            <p
              className={`text-sm font-bold mb-0.5 truncate tracking-tight ${isSettled ? 'line-through text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}
              style={{ letterSpacing: '-0.01em' }}
            >
              {fromUser?.name || fromUser?.email || 'Unknown'}
            </p>
            <p className={`text-xs font-medium ${isSettled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
              {isSettled ? 'settled' : 'owes'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="text-center">
            {hasPaidAmount ? (
              <div>
                <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                  ₹{(balance.originalAmount || balance.amount).toFixed(2)}
                </div>
                <div
                  className="text-base sm:text-lg font-black text-amber-600 tracking-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  ₹{balance.amount.toFixed(2)}
                </div>
              </div>
            ) : isSettled ? (
              <div
                className="text-base sm:text-lg font-black text-green-600 dark:text-green-400 tracking-tight line-through"
                style={{ letterSpacing: '-0.02em' }}
              >
                ₹{(balance.originalAmount || balance.paidAmount || 0).toFixed(2)}
              </div>
            ) : (
              <div
                className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight"
                style={{ letterSpacing: '-0.02em' }}
              >
                ₹{balance.amount.toFixed(2)}
              </div>
            )}
          </div>
          <ArrowRight
            className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isSettled ? 'text-green-400 dark:text-green-600' : 'text-gray-400 dark:text-gray-500'}`}
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar
              src={toUser?.avatar_url}
              alt={toUser?.name || 'User'}
              name={toUser?.name}
              email={toUser?.email}
              size="sm"
            />
            <p
              className={`text-sm font-bold truncate tracking-tight hidden sm:block ${isSettled ? 'line-through text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}
              style={{ letterSpacing: '-0.01em' }}
            >
              {toUser?.name || toUser?.email || 'Unknown'}
            </p>
          </div>
          {isClickable && !isSettled && <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
        </div>
      </div>
      {hasPaidAmount && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
          ₹{balance.paidAmount?.toFixed(2)} paid • ₹{balance.amount.toFixed(2)} remaining
        </div>
      )}
    </>
  )

  if (isClickable && !isSettled) {
    return (
      <button onClick={onClick} className={containerClass}>
        {content}
      </button>
    )
  }

  return <div className={containerClass}>{content}</div>
}

export function RawBalanceView({ balances, currentUserId, groupId }: RawBalanceViewProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>(currentUserId ? 'my' : 'all')
  const router = useRouter()

  const handleBalanceClick = (balance: RawBalance) => {
    router.push(
      `/groups/${groupId}/balances/${balance.from_user_id}/${balance.to_user_id}`
    )
  }

  // "My Balances": filter for balances involving the current user
  // Balances are already netted (one-directional: debtor → creditor), so no re-netting needed
  const myBalances = useMemo(() => {
    if (!currentUserId || balances.length === 0) return []
    return balances.filter(
      (b) => b.from_user_id === currentUserId || b.to_user_id === currentUserId
    )
  }, [balances, currentUserId])

  // "All Balances": show all non-zero balances
  const allBalances = useMemo(() => {
    return balances.filter((b) => b.amount > 0.01 || b.isSettled)
  }, [balances])

  const displayBalances = activeTab === 'my' ? myBalances : allBalances

  // Sort: unsettled first (by amount descending), then settled
  const sortedBalances = useMemo(() => {
    return [...displayBalances].sort((a, b) => {
      if (a.isSettled && !b.isSettled) return 1
      if (!a.isSettled && b.isSettled) return -1
      return b.amount - a.amount
    })
  }, [displayBalances])

  if (!currentUserId) {
    if (allBalances.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-500">All settled up! No balances to display.</p>
        </div>
      )
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        {allBalances.map((balance, index) => (
          <BalanceRow
            key={`${balance.from_user_id}-${balance.to_user_id}-${index}`}
            balance={balance}
            isClickable={false}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'my'
              ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          My Balances
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          All Balances
        </button>
      </div>

      {sortedBalances.length === 0 ? (
        <div className="text-center py-24">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 dark:bg-gray-100 mb-6">
              <CheckCircle2 className="h-10 w-10 text-white dark:text-gray-900" />
            </div>
            <h3
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight"
              style={{ letterSpacing: '-0.02em' }}
            >
              All settled up!
            </h3>
            <p className="text-base font-medium text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              No balances to display.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {activeTab === 'my' && (
            <SettleAllButton debts={balances} groupId={groupId} currentUserId={currentUserId} />
          )}
          {sortedBalances.map((balance, index) => {
            const isCreditor = currentUserId === balance.to_user_id && !balance.isSettled && balance.amount > 0.01

            return (
              <div key={`${balance.from_user_id}-${balance.to_user_id}-${index}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <BalanceRow
                    balance={balance}
                    isClickable={activeTab === 'my'}
                    onClick={() => handleBalanceClick(balance)}
                  />
                </div>
                {isCreditor && (
                  <RemindButton
                    groupId={groupId}
                    debtorId={balance.from_user_id}
                    creditorId={balance.to_user_id}
                    amount={balance.amount}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
