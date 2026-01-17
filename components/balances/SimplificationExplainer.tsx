'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface GroupMember {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  netBalance: number
}

interface SimplificationExplainerProps {
  groupId: string
  fromUserId: string
  toUserId: string
  simplifiedAmount: number
  rawAmount: number
}

export function SimplificationExplainer({
  groupId,
  fromUserId,
  toUserId,
  simplifiedAmount,
  rawAmount,
}: SimplificationExplainerProps) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroupData() {
      const supabase = createClient()

      // Get group members
      const { data: memberData } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

      if (!memberData) {
        setLoading(false)
        return
      }

      const userIds = memberData.map(m => m.user_id)

      // Get user details
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      // Get all expenses for this group to calculate net balances
      const { data: expenses } = await supabase
        .from('expenses')
        .select(`
          id,
          paid_by,
          amount,
          splits:expense_splits (
            user_id,
            owed_amount
          )
        `)
        .eq('group_id', groupId)

      // Calculate net balance for each member
      const netBalances = new Map<string, number>()
      userIds.forEach(id => netBalances.set(id, 0))

      expenses?.forEach((expense: any) => {
        const payerId = expense.paid_by
        const splits = expense.splits || []

        // Calculate what others owe the payer
        const othersOwe = splits
          .filter((s: any) => s.user_id !== payerId)
          .reduce((sum: number, s: any) => sum + s.owed_amount, 0)

        // Payer is credited
        netBalances.set(payerId, (netBalances.get(payerId) || 0) + othersOwe)

        // Each person owes their share
        splits.forEach((split: any) => {
          if (split.user_id !== payerId) {
            netBalances.set(split.user_id, (netBalances.get(split.user_id) || 0) - split.owed_amount)
          }
        })
      })

      // Combine user data with net balances
      const membersWithBalances: GroupMember[] = (users || []).map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        netBalance: Math.round((netBalances.get(user.id) || 0) * 100) / 100,
      }))

      // Sort by net balance (creditors first, then debtors)
      membersWithBalances.sort((a, b) => b.netBalance - a.netBalance)

      setMembers(membersWithBalances)
      setLoading(false)
    }

    fetchGroupData()
  }, [groupId])

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-xl h-48"></div>
    )
  }

  if (members.length < 3) {
    // No simplification needed for 2 people
    return null
  }

  const creditors = members.filter(m => m.netBalance > 0.01)
  const debtors = members.filter(m => m.netBalance < -0.01)
  const settled = members.filter(m => Math.abs(m.netBalance) <= 0.01)

  const fromMember = members.find(m => m.id === fromUserId)
  const toMember = members.find(m => m.id === toUserId)

  return (
    <div className="mb-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 p-4 sm:p-6">
      <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        How Debt Simplification Works
      </h4>

      {/* Group Members Net Balances */}
      <div className="mb-4">
        <p className="text-xs font-medium text-indigo-700 mb-3">Group Members&apos; Net Balances:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {members.map((member) => {
            const isDebtor = member.netBalance < -0.01
            const isCreditor = member.netBalance > 0.01
            const isHighlighted = member.id === fromUserId || member.id === toUserId
            
            return (
              <div
                key={member.id}
                className={`rounded-lg p-2 flex items-center gap-2 ${
                  isHighlighted
                    ? 'bg-white ring-2 ring-indigo-400 shadow-md'
                    : 'bg-white/60'
                }`}
              >
                <Avatar
                  src={member.avatar_url}
                  alt={member.name || 'User'}
                  name={member.name}
                  email={member.email}
                  size="xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {member.name || member.email?.split('@')[0] || 'User'}
                  </p>
                  <div className="flex items-center gap-1">
                    {isCreditor && <TrendingUp className="h-3 w-3 text-green-600" />}
                    {isDebtor && <TrendingDown className="h-3 w-3 text-red-600" />}
                    {!isCreditor && !isDebtor && <Minus className="h-3 w-3 text-gray-400" />}
                    <span className={`text-xs font-bold ${
                      isCreditor ? 'text-green-600' : isDebtor ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {isCreditor ? '+' : ''}₹{Math.abs(member.netBalance).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Simplification Explanation */}
      <div className="bg-white/80 rounded-lg p-3 mb-4">
        <p className="text-xs text-indigo-800 mb-2">
          <strong>The algorithm</strong> matches people who owe money with those who are owed, creating the minimum number of transactions:
        </p>
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {debtors.slice(0, 3).map((d, i) => (
                <Avatar
                  key={d.id}
                  src={d.avatar_url}
                  alt={d.name || 'User'}
                  name={d.name}
                  email={d.email}
                  size="xs"
                />
              ))}
              {debtors.length > 3 && (
                <span className="text-xs text-gray-500">+{debtors.length - 3}</span>
              )}
            </div>
            <p className="text-[10px] font-medium text-red-600">
              {debtors.length} owe money
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-indigo-400" />
          <div className="bg-indigo-100 rounded-full p-2">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <ArrowRight className="h-5 w-5 text-indigo-400" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {creditors.slice(0, 3).map((c, i) => (
                <Avatar
                  key={c.id}
                  src={c.avatar_url}
                  alt={c.name || 'User'}
                  name={c.name}
                  email={c.email}
                  size="xs"
                />
              ))}
              {creditors.length > 3 && (
                <span className="text-xs text-gray-500">+{creditors.length - 3}</span>
              )}
            </div>
            <p className="text-[10px] font-medium text-green-600">
              {creditors.length} are owed
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown - Where does the money go? */}
      {fromMember && (
        <div className="bg-white rounded-lg p-3 border-2 border-indigo-300">
          <p className="text-xs font-medium text-indigo-700 mb-3">
            💰 {fromMember.name || fromMember.email?.split('@')[0]}&apos;s Payment Plan:
          </p>
          
          {/* Show all payments this person needs to make */}
          <div className="space-y-2 mb-3">
            {creditors.map((creditor) => {
              // Calculate how much fromMember owes this creditor
              // In simplified form, it's min(what debtor owes, what creditor is owed)
              const isCurrentTransaction = creditor.id === toUserId
              const paymentAmount = isCurrentTransaction ? simplifiedAmount : 
                Math.min(Math.abs(fromMember.netBalance) - simplifiedAmount, creditor.netBalance)
              
              if (paymentAmount <= 0.01 && !isCurrentTransaction) return null
              
              return (
                <div 
                  key={creditor.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isCurrentTransaction 
                      ? 'bg-indigo-100 ring-2 ring-indigo-400' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={fromMember.avatar_url}
                      alt={fromMember.name || 'User'}
                      name={fromMember.name}
                      email={fromMember.email}
                      size="xs"
                    />
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Avatar
                      src={creditor.avatar_url}
                      alt={creditor.name || 'User'}
                      name={creditor.name}
                      email={creditor.email}
                      size="xs"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {creditor.name || creditor.email?.split('@')[0]}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    isCurrentTransaction ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    ₹{isCurrentTransaction ? simplifiedAmount.toFixed(2) : creditor.netBalance.toFixed(2)}
                    {isCurrentTransaction && <span className="text-xs ml-1">(this page)</span>}
                  </span>
                </div>
              )
            })}
          </div>
          
          {/* Total */}
          <div className="border-t border-indigo-200 pt-2 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">Total to pay:</span>
            <span className="text-sm font-black text-red-600">
              ₹{Math.abs(fromMember.netBalance).toFixed(2)}
            </span>
          </div>
        </div>
      )}
      
      {/* Why different from raw expenses? */}
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mt-4">
        <p className="text-xs font-bold text-amber-800 mb-1">⚠️ Why is the table below different?</p>
        <p className="text-xs text-amber-700">
          The table shows <strong>direct expenses (₹{rawAmount.toFixed(2)})</strong> between just these two people. 
          But the <strong>simplified payment (₹{simplifiedAmount.toFixed(2)})</strong> is calculated considering ALL group members to minimize total transactions.
        </p>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span className="text-gray-600">Gets money back</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-red-600" />
          <span className="text-gray-600">Owes money</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="h-3 w-3 text-gray-400" />
          <span className="text-gray-600">Settled</span>
        </div>
      </div>
    </div>
  )
}

