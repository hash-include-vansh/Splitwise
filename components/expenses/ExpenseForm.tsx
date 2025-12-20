'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense } from '@/lib/services/expenses-client'
import { SplitTypeSelector } from './SplitTypeSelector'
import { SplitConfigurator } from './SplitConfigurator'
import type { SplitType, GroupMember } from '@/lib/types'
import { validateSplits } from '@/lib/utils/splitCalculations'

interface ExpenseFormProps {
  groupId: string
  members: GroupMember[]
  currentUserId: string
}

export function ExpenseForm({ groupId, members, currentUserId }: ExpenseFormProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [splitConfig, setSplitConfig] = useState<any>({})
  const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableMembers = members.filter((m) => !excludedMembers.includes(m.user_id))
  // Use string comparison for stable dependencies to prevent infinite loops
  const memberIdsStr = useMemo(() => members.map((m) => m.user_id).sort().join(','), [members])
  const availableMemberIdsStr = useMemo(() => availableMembers.map((m) => m.user_id).sort().join(','), [availableMembers])
  const initializedSplitType = useRef<string | null>(null)

  useEffect(() => {
    // Only initialize once per split type change, not on every render
    if (initializedSplitType.current === splitType) {
      return
    }
    
    initializedSplitType.current = splitType
    
    // Initialize split config based on type - include all members, not just available ones
    const memberIdArray = members.map((m) => m.user_id)
    const availableMemberIdArray = availableMembers.map((m) => m.user_id)
    
    if (splitType === 'equal' && availableMemberIdArray.length > 0) {
      setSplitConfig({ memberIds: availableMemberIdArray })
    } else if (splitType === 'unequal') {
      setSplitConfig((prevConfig: any) => {
        const existingAmounts = prevConfig?.amounts || {}
        return {
          amounts: Object.fromEntries(
            memberIdArray.map((id) => [id, existingAmounts[id] !== undefined ? existingAmounts[id] : ''])
          ),
        }
      })
    } else if (splitType === 'percentage') {
      setSplitConfig((prevConfig: any) => {
        const existingPercentages = prevConfig?.percentages || {}
        return {
          percentages: Object.fromEntries(
            memberIdArray.map((id) => [id, existingPercentages[id] !== undefined ? existingPercentages[id] : ''])
          ),
        }
      })
    } else if (splitType === 'shares') {
      setSplitConfig((prevConfig: any) => {
        const existingShares = prevConfig?.shares || {}
        return {
          shares: Object.fromEntries(
            memberIdArray.map((id) => [id, existingShares[id] !== undefined ? existingShares[id] : '1'])
          ),
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitType, memberIdsStr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    // Build splits based on type
    let splits: Array<{ user_id: string; owed_amount: number }> = []

    if (splitType === 'equal') {
      const splitAmount = amountNum / availableMembers.length
      splits = availableMembers.map((m) => ({
        user_id: m.user_id,
        owed_amount: splitAmount,
      }))
    } else if (splitType === 'unequal') {
      const amounts = splitConfig.amounts || {}
      splits = Object.entries(amounts)
        .filter(([userId, val]) => 
          !excludedMembers.includes(userId) && 
          val !== '' && 
          !isNaN(parseFloat(val as string))
        )
        .map(([userId, val]) => ({
          user_id: userId,
          owed_amount: parseFloat(val as string),
        }))
    } else if (splitType === 'percentage') {
      const percentages = splitConfig.percentages || {}
      // Filter and calculate splits for non-excluded members only
      splits = Object.entries(percentages)
        .filter(([userId, val]) => {
          const isExcluded = excludedMembers.includes(userId)
          const hasValue = val !== '' && val !== null && val !== undefined
          const isValidNumber = !isNaN(parseFloat(String(val)))
          return !isExcluded && hasValue && isValidNumber
        })
        .map(([userId, val]) => {
          const percentageValue = parseFloat(String(val))
          // Ensure percentage is between 0 and 100, not a calculated amount
          // If the value is > 100, it might be stored as an amount, so we need to recalculate
          let percentage = percentageValue
          if (percentageValue > 100 && amountNum > 0) {
            // This might be stored as an amount, convert back to percentage
            percentage = (percentageValue / amountNum) * 100
          }
          const owedAmount = Math.round((amountNum * percentage / 100 + Number.EPSILON) * 100) / 100
          return {
            user_id: userId,
            owed_amount: owedAmount,
          }
        })
    } else if (splitType === 'shares') {
      const shares = splitConfig.shares || {}
      const shareEntries = Object.entries(shares).filter(
        ([userId, val]) => 
          !excludedMembers.includes(userId) && 
          val !== '' && 
          !isNaN(parseFloat(val as string))
      )
      const totalShares = shareEntries.reduce(
        (sum, [_, val]) => sum + parseFloat(val as string),
        0
      )
      splits = shareEntries.map(([userId, val]) => ({
        user_id: userId,
        owed_amount: (amountNum * parseFloat(val as string)) / totalShares,
      }))
    }

    // Validate splits
    if (splits.length === 0) {
      setError('At least one member must be included in the split')
      return
    }
    
    // Validate splits (validation function handles duplicates internally)
    const validation = validateSplits(amountNum, splits)
    if (!validation.valid) {
      setError(validation.error || 'Invalid split configuration')
      return
    }

    setLoading(true)
    try {
      const { data, error: expenseError } = await createExpense({
        group_id: groupId,
        paid_by: paidBy,
        amount: amountNum,
        description,
        split_type: splitType,
        splits,
        excluded_members: excludedMembers,
      })

      if (expenseError || !data) {
        setError(expenseError?.message || 'Failed to create expense')
        setLoading(false)
        return
      }

      // Success - redirect to expenses list immediately
      // Use window.location for reliable redirect
      window.location.href = `/groups/${groupId}/expenses`
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          placeholder="e.g., Pizza night, Uber ride, Coffee break..."
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0.01"
          step="0.01"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          placeholder="Enter amount"
        />
      </div>

      <div>
        <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
          Paid by
        </label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
        >
          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.user?.name || member.user?.email || 'Unknown'}
            </option>
          ))}
        </select>
      </div>

      <SplitTypeSelector value={splitType} onChange={setSplitType} />

      <SplitConfigurator
        splitType={splitType}
        amount={parseFloat(amount) || 0}
        members={members}
        config={splitConfig}
        onConfigChange={setSplitConfig}
        excludedMembers={excludedMembers}
        onExcludedMembersChange={setExcludedMembers}
      />

      {error && (
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/60 p-4 text-sm text-red-700 shadow-soft">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !description.trim() || !amount}
              className="flex-1 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-gray-900 hover:to-black hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {loading ? 'Creating...' : 'Create Expense'}
        </button>
      </div>
    </form>
  )
}

