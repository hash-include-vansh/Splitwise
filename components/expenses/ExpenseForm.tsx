'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses'
import { SplitTypeSelector } from './SplitTypeSelector'
import { SplitConfigurator } from './SplitConfigurator'
import type { SplitType, GroupMember, Expense } from '@/lib/types'
import { validateSplits, calculateEqualSplit, calculatePercentageSplit, calculateShareSplit } from '@/lib/utils/splitCalculations'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import { toast } from 'react-toastify'

interface ExpenseFormProps {
  groupId: string
  members: GroupMember[]
  currentUserId: string
  /** If provided, the form is in edit mode */
  initialData?: Expense
}

export function ExpenseForm({ groupId, members, currentUserId, initialData }: ExpenseFormProps) {
  const router = useRouter()
  const createExpenseMutation = useCreateExpense()
  const updateExpenseMutation = useUpdateExpense()
  const isEditMode = !!initialData

  const [description, setDescription] = useState(initialData?.description || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || 'general')
  const [paidBy, setPaidBy] = useState(initialData?.paid_by || currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [splitConfig, setSplitConfig] = useState<any>({})
  const [excludedMembers, setExcludedMembers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const loading = createExpenseMutation.isPending || updateExpenseMutation.isPending

  const availableMembers = members.filter((m) => !excludedMembers.includes(m.user_id))
  // Use string comparison for stable dependencies to prevent infinite loops
  const memberIdsStr = useMemo(() => members.map((m) => m.user_id).sort().join(','), [members])
  const availableMemberIdsStr = useMemo(() => availableMembers.map((m) => m.user_id).sort().join(','), [availableMembers])
  const initializedSplitType = useRef<string | null>(null)

  // In edit mode, figure out excluded members from the existing splits
  useEffect(() => {
    if (initialData?.splits) {
      const splitUserIds = new Set(initialData.splits.map(s => s.user_id))
      const excluded = members
        .filter(m => !splitUserIds.has(m.user_id))
        .map(m => m.user_id)
      setExcludedMembers(excluded)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          let percentage = percentageValue
          if (percentageValue > 100 && amountNum > 0) {
            percentage = (percentageValue / amountNum) * 100
          }
          acc[userId] = percentage
          return acc
        }, {} as Record<string, number>)

      splits = calculatePercentageSplit(amountNum, filteredPercentages)

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

      splits = calculateShareSplit(amountNum, filteredShares)

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

    const validation = validateSplits(amountNum, splits)
    if (!validation.valid) {
      setError(validation.error || 'Invalid split configuration')
      return
    }

    const expenseData = {
      group_id: groupId,
      paid_by: paidBy,
      amount: amountNum,
      description,
      category,
      split_type: splitType,
      splits,
      excluded_members: excludedMembers,
    }

    try {
      if (isEditMode) {
        await updateExpenseMutation.mutateAsync({
          expenseId: initialData.id,
          data: expenseData,
        })
        toast.success('Expense updated successfully!', {
          position: 'top-right',
          autoClose: 2000,
        })
        router.push(`/groups/${groupId}/expenses/${initialData.id}`)
      } else {
        await createExpenseMutation.mutateAsync(expenseData)
        toast.success('Expense created successfully!', {
          position: 'top-right',
          autoClose: 2000,
        })
        router.push(`/groups/${groupId}/expenses`)
      }
    } catch (err: any) {
      const errorMessage = err?.message || `Failed to ${isEditMode ? 'update' : 'create'} expense`
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
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {EXPENSE_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = category === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? `${cat.bgColor} ${cat.textColor} shadow-md scale-105`
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
          placeholder="e.g., Pizza night, Uber ride, Coffee break..."
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
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
          className="w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
          placeholder="Enter amount"
        />
      </div>

      <div>
        <label htmlFor="paidBy" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          Paid by
        </label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          required
          className="w-full rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-gray-100 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all"
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
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200/60 dark:border-red-800/60 p-4 text-sm text-red-700 dark:text-red-400 shadow-soft dark:shadow-none">
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
          className="flex-1 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !description.trim() || !amount}
          className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 dark:from-white dark:to-gray-100 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-gray-900 shadow-md hover:from-gray-900 hover:to-black dark:hover:from-gray-100 dark:hover:to-gray-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Expense' : 'Create Expense')}
        </button>
      </div>
    </form>
  )
}
