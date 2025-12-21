'use client'
// Cache-busting: v2 - Fixed selectedBalance error, clickable only in My Balances tab

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { RawBalance } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface RawBalanceViewProps {
  balances: RawBalance[]
  currentUserId?: string
  groupId: string
}

export function RawBalanceView({ balances, currentUserId, groupId }: RawBalanceViewProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>(currentUserId ? 'my' : 'all')
  const router = useRouter()

  const handleBalanceClick = (balance: RawBalance) => {
    // Only allow clicking in "My Balances" tab
    if (activeTab === 'my') {
      router.push(`/groups/${groupId}/balances/${balance.from_user_id}/${balance.to_user_id}`)
    }
  }

  // Filter and simplify balances for current user
  const myBalances = useMemo(() => {
    if (!currentUserId || balances.length === 0) return []

    // Filter balances where current user is either the debtor or creditor
    const userBalances = balances.filter(
      (b) => b.from_user_id === currentUserId || b.to_user_id === currentUserId
    )

    // Simplify pair-level debts
    const pairMap = new Map<string, { net: number; balances: RawBalance[] }>()

    userBalances.forEach((balance) => {
      const [id1, id2] = [balance.from_user_id, balance.to_user_id].sort()
      const key = `${id1}|${id2}`

      const existing = pairMap.get(key) || { net: 0, balances: [] }
      
      if (balance.from_user_id === id1) {
        existing.net += balance.amount
      } else {
        existing.net -= balance.amount
      }
      
      existing.balances.push(balance)
      pairMap.set(key, existing)
    })

    // Convert to simplified balances
    const simplified: RawBalance[] = []
    pairMap.forEach((pair, key) => {
      if (Math.abs(pair.net) > 0.01) {
        const [id1, id2] = key.split('|')
        const anyBalance = pair.balances[0]
        let user1, user2
        
        if (anyBalance.from_user_id === id1) {
          user1 = anyBalance.from_user
        } else if (anyBalance.to_user_id === id1) {
          user1 = anyBalance.to_user
        } else {
          const balanceWithId1 = pair.balances.find(b => b.from_user_id === id1 || b.to_user_id === id1)
          user1 = balanceWithId1?.from_user_id === id1 ? balanceWithId1.from_user : balanceWithId1?.to_user
        }
        
        if (anyBalance.from_user_id === id2) {
          user2 = anyBalance.to_user
        } else if (anyBalance.to_user_id === id2) {
          user2 = anyBalance.to_user
        } else {
          const balanceWithId2 = pair.balances.find(b => b.from_user_id === id2 || b.to_user_id === id2)
          user2 = balanceWithId2?.from_user_id === id2 ? balanceWithId2.from_user : balanceWithId2?.to_user
        }
        
        if (pair.net > 0) {
          simplified.push({
            from_user_id: id1,
            to_user_id: id2,
            amount: Math.round((pair.net + Number.EPSILON) * 100) / 100,
            from_user: user1,
            to_user: user2,
          })
        } else {
          simplified.push({
            from_user_id: id2,
            to_user_id: id1,
            amount: Math.round((Math.abs(pair.net) + Number.EPSILON) * 100) / 100,
            from_user: user2,
            to_user: user1,
          })
        }
      }
    })

    return simplified
  }, [balances, currentUserId])

  const allBalances = balances

  // If no current user, only show all balances (no tabs)
  if (!currentUserId) {
    if (allBalances.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">All settled up! No balances to display.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {allBalances.map((balance, index) => {
          const fromUser = balance.from_user
          const toUser = balance.to_user

          return (
            <div
              key={`${balance.from_user_id}-${balance.to_user_id}-${index}`}
              className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-elegant"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar
                    src={fromUser?.avatar_url}
                    alt={fromUser?.name || 'User'}
                    name={fromUser?.name}
                    email={fromUser?.email}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 mb-0.5 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                      {fromUser?.name || fromUser?.email || 'Unknown'}
                    </p>
                    <p className="text-xs font-medium text-gray-500">owes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                      ₹{balance.amount.toFixed(2)}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar
                      src={toUser?.avatar_url}
                      alt={toUser?.name || 'User'}
                      name={toUser?.name}
                      email={toUser?.email}
                      size="sm"
                    />
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight hidden sm:block" style={{ letterSpacing: '-0.01em' }}>
                      {toUser?.name || toUser?.email || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const displayBalances = activeTab === 'my' ? myBalances : allBalances

  if (displayBalances.length === 0) {
    return (
      <div>
        <div className="mb-6 flex gap-1 border-b border-gray-200/60">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'my'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Balances
            {activeTab === 'my' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${
              activeTab === 'all'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Balances
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
            )}
          </button>
        </div>
        <div className="text-center py-24">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 mb-6">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              All settled up!
            </h3>
            <p className="text-base font-medium text-gray-600 max-w-sm mx-auto">
              No balances to display.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'my'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Balances
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Balances
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {displayBalances.map((balance, index) => {
          const fromUser = balance.from_user
          const toUser = balance.to_user
          const isClickable = activeTab === 'my'

          if (isClickable) {
            return (
              <button
                key={`${balance.from_user_id}-${balance.to_user_id}-${index}`}
                onClick={() => handleBalanceClick(balance)}
                className="w-full text-left rounded-xl border border-gray-200/60 bg-white p-4 shadow-elegant transition-all hover:shadow-medium hover:border-gray-300/60 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      src={fromUser?.avatar_url}
                      alt={fromUser?.name || 'User'}
                      name={fromUser?.name}
                      email={fromUser?.email}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-0.5 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                        {fromUser?.name || fromUser?.email || 'Unknown'}
                      </p>
                      <p className="text-xs font-medium text-gray-500">owes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        ₹{balance.amount.toFixed(2)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar
                        src={toUser?.avatar_url}
                        alt={toUser?.name || 'User'}
                        name={toUser?.name}
                        email={toUser?.email}
                        size="sm"
                      />
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight hidden sm:block" style={{ letterSpacing: '-0.01em' }}>
                        {toUser?.name || toUser?.email || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            )
          } else {
            return (
              <div
                key={`${balance.from_user_id}-${balance.to_user_id}-${index}`}
                className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-elegant"
              >
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      src={fromUser?.avatar_url}
                      alt={fromUser?.name || 'User'}
                      name={fromUser?.name}
                      email={fromUser?.email}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 mb-0.5 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                        {fromUser?.name || fromUser?.email || 'Unknown'}
                      </p>
                      <p className="text-xs font-medium text-gray-500">owes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                        ₹{balance.amount.toFixed(2)}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Avatar
                        src={toUser?.avatar_url}
                        alt={toUser?.name || 'User'}
                        name={toUser?.name}
                        email={toUser?.email}
                        size="sm"
                      />
                      <p className="text-sm font-bold text-gray-900 truncate tracking-tight hidden sm:block" style={{ letterSpacing: '-0.01em' }}>
                        {toUser?.name || toUser?.email || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}
