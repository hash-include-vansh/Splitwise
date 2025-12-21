'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateExpense } from '@/hooks/useExpenses'
import { SplitTypeSelector } from './SplitTypeSelector'
import { SplitConfigurator } from './SplitConfigurator'
import type { SplitType, GroupMember } from '@/lib/types'
import { validateSplits, calculateEqualSplit, calculatePercentageSplit, calculateShareSplit } from '@/lib/utils/splitCalculations'
import { toast } from 'react-toastify'

interface ExpenseFormProps {
  groupId: string
  members: GroupMember[]
  currentUserId: string
}

export function ExpenseForm({ groupId, members, currentUserId }: ExpenseFormProps) {
  const router = useRouter()
  const createExpenseMutation = useCreateExpense()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [splitConfig, setSplitConfig] = useState<any>({})
  const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const loading = createExpenseMutation.isPending

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
      // Use calculateEqualSplit which handles rounding errors by adjusting the last split
      splits = calculateEqualSplit(amountNum, availableMembers.map(m => m.user_id))
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
      const filteredPercentages = Object.entries(percentages)
        .filter(([userId, val]) => {
          const isExcluded = excludedMembers.includes(userId)
          const hasValue = val !== '' && val !== null && val !== undefined
          const isValidNumber = !isNaN(parseFloat(String(val)))
          return !isExcluded && hasValue && isValidNumber
        })
        .reduce((acc, [userId, val]) => {
          const percentageValue = parseFloat(String(val))
          // Ensure percentage is between 0 and 100, not a calculated amount
          // If the value is > 100, it might be stored as an amount, so we need to recalculate
          let percentage = percentageValue
          if (percentageValue > 100 && amountNum > 0) {
            // This might be stored as an amount, convert back to percentage
            percentage = (percentageValue / amountNum) * 100
          }
          acc[userId] = percentage
          return acc
        }, {} as Record<string, number>)
      
      // Use calculatePercentageSplit which handles rounding
      splits = calculatePercentageSplit(amountNum, filteredPercentages)
      
      // Adjust the last split to ensure total matches exactly
      if (splits.length > 0) {
        const total = splits.reduce((sum, s) => sum + s.owed_amount, 0)
        const difference = amountNum - total
        if (Math.abs(difference) > 0.001) {
          splits[splits.length - 1].owed_amount = Math.round((splits[splits.length - 1].owed_amount + difference + Number.EPSILON) * 100) / 100
        }
      }
    } else if (splitType === 'shares') {
      const shares = splitConfig.shares || {}
      const filteredShares = Object.entries(shares)
        .filter(
          ([userId, val]) => 
            !excludedMembers.includes(userId) && 
            val !== '' && 
            !isNaN(parseFloat(val as string))
        )
        .reduce((acc, [userId, val]) => {
          acc[userId] = parseFloat(val as string)
          return acc
        }, {} as Record<string, number>)
      
      // Use calculateShareSplit which handles rounding
      splits = calculateShareSplit(amountNum, filteredShares)
      
      // Adjust the last split to ensure total matches exactly
      if (splits.length > 0) {
        const total = splits.reduce((sum, s) => sum + s.owed_amount, 0)
        const difference = amountNum - total
        if (Math.abs(difference) > 0.001) {
          splits[splits.length - 1].owed_amount = Math.round((splits[splits.length - 1].owed_amount + difference + Number.EPSILON) * 100) / 100
        }
      }
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

    try {
      await createExpenseMutation.mutateAsync({
        group_id: groupId,
        paid_by: paidBy,
        amount: amountNum,
        description,
        split_type: splitType,
        splits,
        excluded_members: excludedMembers,
      })

      // Success - show toast and redirect
      toast.success('Expense created successfully!', {
        position: 'top-right',
        autoClose: 2000,
      })
      
      // Use router.push for client-side navigation (faster, no full page reload)
      router.push(`/groups/${groupId}/expenses`)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create expense'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
      <div>
        <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          placeholder="e.g., Pizza night, Uber ride, Coffee break..."
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
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
          className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          placeholder="Enter amount"
        />
      </div>

      <div>
        <label htmlFor="paidBy" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Paid by
        </label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          required
          className="w-full rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
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

      <div className="flex gap-2 sm:gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg sm:rounded-xl border border-gray-300 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !description.trim() || !amount}
          className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-gray-900 hover:to-black hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {loading ? 'Creating...' : 'Create Expense'}
        </button>
      </div>
    </form>
  )
}

