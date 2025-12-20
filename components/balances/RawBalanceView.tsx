'use client'

import { useState, useMemo } from 'react'
import type { RawBalance } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'

interface RawBalanceViewProps {
  balances: RawBalance[]
  currentUserId?: string
}

export function RawBalanceView({ balances, currentUserId }: RawBalanceViewProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'all'>(currentUserId ? 'my' : 'all')

  // Filter and simplify balances for current user
  const myBalances = useMemo(() => {
    if (!currentUserId || balances.length === 0) return []

    // Filter balances where current user is either the debtor or creditor
    const userBalances = balances.filter(
      (b) => b.from_user_id === currentUserId || b.to_user_id === currentUserId
    )

    // Simplify pair-level debts
    // Track net amounts between each pair of users
    // Use a normalized key (sorted IDs) to identify pairs
    const pairMap = new Map<string, { net: number; balances: RawBalance[] }>()

    userBalances.forEach((balance) => {
      // Create normalized key (always smaller ID first)
      const [id1, id2] = [balance.from_user_id, balance.to_user_id].sort()
      const key = `${id1}|${id2}`

      const existing = pairMap.get(key) || { net: 0, balances: [] }
      
      // Calculate net: positive if id1 owes id2, negative if id2 owes id1
      if (balance.from_user_id === id1) {
        // id1 owes id2
        existing.net += balance.amount
      } else {
        // id2 owes id1 (reverse direction)
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
        
        // Find user objects for both IDs from any balance in the pair
        const anyBalance = pair.balances[0]
        let user1, user2
        
        // Get user1
        if (anyBalance.from_user_id === id1) {
          user1 = anyBalance.from_user
        } else if (anyBalance.to_user_id === id1) {
          user1 = anyBalance.to_user
        } else {
          // Try to find from other balances
          const balanceWithId1 = pair.balances.find(b => b.from_user_id === id1 || b.to_user_id === id1)
          user1 = balanceWithId1?.from_user_id === id1 ? balanceWithId1.from_user : balanceWithId1?.to_user
        }
        
        // Get user2
        if (anyBalance.from_user_id === id2) {
          user2 = anyBalance.from_user
        } else if (anyBalance.to_user_id === id2) {
          user2 = anyBalance.to_user
        } else {
          // Try to find from other balances
          const balanceWithId2 = pair.balances.find(b => b.from_user_id === id2 || b.to_user_id === id2)
          user2 = balanceWithId2?.from_user_id === id2 ? balanceWithId2.from_user : balanceWithId2?.to_user
        }
        
        // Determine who owes whom based on net
        if (pair.net > 0) {
          // id1 owes id2
          simplified.push({
            from_user_id: id1,
            to_user_id: id2,
            amount: Math.round((pair.net + Number.EPSILON) * 100) / 100,
            from_user: user1,
            to_user: user2,
          })
        } else {
          // id2 owes id1
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
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={fromUser?.avatar_url}
                    alt={fromUser?.name || 'User'}
                    name={fromUser?.name}
                    email={fromUser?.email}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fromUser?.name || fromUser?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">owes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      ₹{balance.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={toUser?.avatar_url}
                      alt={toUser?.name || 'User'}
                      name={toUser?.name}
                      email={toUser?.email}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {toUser?.name || toUser?.email || 'Unknown'}
                      </p>
                    </div>
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
        <div className="mb-4 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'my'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Balances
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Balances
          </button>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">All settled up! No balances to display.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'my'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Balances
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Balances
        </button>
      </div>

      <div className="space-y-4">
        {displayBalances.map((balance, index) => {
          const fromUser = balance.from_user
          const toUser = balance.to_user

          return (
            <div
              key={`${balance.from_user_id}-${balance.to_user_id}-${index}`}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={fromUser?.avatar_url}
                    alt={fromUser?.name || 'User'}
                    name={fromUser?.name}
                    email={fromUser?.email}
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fromUser?.name || fromUser?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">owes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      ₹{balance.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={toUser?.avatar_url}
                      alt={toUser?.name || 'User'}
                      name={toUser?.name}
                      email={toUser?.email}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {toUser?.name || toUser?.email || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

