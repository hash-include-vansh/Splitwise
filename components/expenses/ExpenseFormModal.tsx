'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateExpense } from '@/hooks/useExpenses'
import { SplitTypeSelector } from './SplitTypeSelector'
import { SplitConfigurator } from './SplitConfigurator'
import { validateSplits, calculateEqualSplit, calculatePercentageSplit, calculateShareSplit } from '@/lib/utils/splitCalculations'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import type { GroupMember, SplitType } from '@/lib/types'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'

interface ExpenseFormModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  members: GroupMember[]
  currentUserId: string
  initialData?: {
    description: string
    amount: number
    paid_by: string
    split_type: SplitType
    category?: string
    included_members?: string[]
    excluded_members?: string[]
    amounts?: { [userId: string]: number }
    percentages?: { [userId: string]: number }
    shares?: { [userId: string]: number }
  }
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  groupId,
  members,
  currentUserId,
  initialData,
}: ExpenseFormModalProps) {
  const router = useRouter()
  const createExpenseMutation = useCreateExpense()
  const [description, setDescription] = useState(initialData?.description || '')
  const [amount, setAmount] = useState(
    initialData?.amount?.toString() || ''
  )
  const [category, setCategory] = useState(initialData?.category || 'general')
  const [paidBy, setPaidBy] = useState(
    initialData?.paid_by || currentUserId
  )
  const [splitType, setSplitType] = useState<SplitType>(
    initialData?.split_type || 'equal'
  )
  const [splitConfig, setSplitConfig] = useState<any>(() => {
    if (initialData) {
      if (initialData.amounts) return { amounts: initialData.amounts }
      if (initialData.percentages) return { percentages: initialData.percentages }
      if (initialData.shares) return { shares: initialData.shares }
    }
    return {}
  })
  const [excludedMembers, setExcludedMembers] = useState<string[]>(
    initialData?.excluded_members || []
  )
  const [error, setError] = useState<string | null>(null)
  
  const loading = createExpenseMutation.isPending

  const memberIds = useMemo(() => members.map((m) => m.user_id), [members])
  const memberIdsStr = useMemo(() => JSON.stringify(memberIds), [memberIds])
  const availableMemberIds = useMemo(
    () => memberIds.filter((id) => !excludedMembers.includes(id)),
    [memberIds, excludedMembers]
  )

  const isSplitConfigInitialized = useRef<Record<string, boolean>>({})

  // Initialize form when initialData changes
  useEffect(() => {
    if (initialData && isOpen) {
      setDescription(initialData.description || '')
      setAmount(initialData.amount?.toString() || '')
      setCategory(initialData.category || 'general')
      setPaidBy(initialData.paid_by || currentUserId)
      setSplitType(initialData.split_type || 'equal')
      setExcludedMembers(initialData.excluded_members || [])
      
      if (initialData.amounts) {
        setSplitConfig({ amounts: initialData.amounts })
      } else if (initialData.percentages) {
        setSplitConfig({ percentages: initialData.percentages })
      } else if (initialData.shares) {
        setSplitConfig({ shares: initialData.shares })
      } else {
        setSplitConfig({})
      }
    }
  }, [initialData, isOpen, currentUserId])

  useEffect(() => {
    if (!isSplitConfigInitialized.current[`${splitType}-${memberIdsStr}`]) {
      if (splitType === 'equal') {
        setSplitConfig({})
      } else if (splitType === 'unequal') {
        setSplitConfig((prevConfig: any) => {
          const existingAmounts = prevConfig.amounts || {}
          return {
            amounts: Object.fromEntries(
              members.map((m) => [m.user_id, existingAmounts[m.user_id] || ''])
            ),
          }
        })
      } else if (splitType === 'percentage') {
        setSplitConfig((prevConfig: any) => {
          const existingPercentages = prevConfig.percentages || {}
          return {
            percentages: Object.fromEntries(
              members.map((m) => [m.user_id, existingPercentages[m.user_id] || ''])
            ),
          }
        })
      } else if (splitType === 'shares') {
        setSplitConfig((prevConfig: any) => {
          const existingShares = prevConfig.shares || {}
          return {
            shares: Object.fromEntries(
              members.map((m) => [m.user_id, existingShares[m.user_id] || ''])
            ),
          }
        })
      }
      isSplitConfigInitialized.current[`${splitType}-${memberIdsStr}`] = true
    }
  }, [splitType, memberIdsStr, members])

  useEffect(() => {
    if (!memberIds.includes(paidBy)) {
      setPaidBy(currentUserId)
    }
  }, [memberIds, paidBy, currentUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    if (availableMemberIds.length === 0) {
      setError('Please include at least one member in the split.')
      return
    }

    let splits: { user_id: string; owed_amount: number }[] = []

    if (splitType === 'equal') {
      // Use calculateEqualSplit which handles rounding errors by adjusting the last split
      splits = calculateEqualSplit(amountNum, availableMemberIds)
    } else if (splitType === 'unequal') {
      const amounts = splitConfig.amounts || {}
      splits = availableMemberIds
        .map((userId) => ({
          user_id: userId,
          owed_amount: parseFloat(amounts[userId] || '0'),
        }))
        .filter((s) => s.owed_amount > 0)
    } else if (splitType === 'percentage') {
      const percentages = splitConfig.percentages || {}
      const filteredPercentages = availableMemberIds
        .filter((userId) => {
          const percentage = parseFloat(percentages[userId] || '0')
          return percentage > 0
        })
        .reduce((acc, userId) => {
          acc[userId] = parseFloat(percentages[userId] || '0')
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
      const filteredShares = availableMemberIds
        .filter((userId) => {
          const share = parseFloat(shares[userId] || '0')
          return share > 0
        })
        .reduce((acc, userId) => {
          acc[userId] = parseFloat(shares[userId] || '0')
          return acc
        }, {} as Record<string, number>)
      
      if (Object.keys(filteredShares).length === 0) {
        setError('Total shares cannot be zero.')
        return
      }
      
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

    const validationResult = validateSplits(amountNum, splits)
    if (!validationResult.valid) {
      setError(validationResult.error || 'Invalid split configuration')
      return
    }

    try {
      await createExpenseMutation.mutateAsync({
        group_id: groupId,
        description,
        amount: amountNum,
        category,
        paid_by: paidBy,
        split_type: splitType,
        splits,
        excluded_members: excludedMembers,
      })

      // Success - show toast, close modal, and redirect
      toast.success('Expense created successfully!', {
        position: 'top-right',
        autoClose: 2000,
      })
      
      onClose()
      router.push(`/groups/${groupId}/expenses`)
    } catch (err: any) {
      console.error('Unexpected error creating expense:', err)
      const errorMessage = err?.message || 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8 shadow-xl dark:shadow-none border-0 sm:border border-gray-200/60 dark:border-gray-700/60 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            Review Expense
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
            <label htmlFor="modal-description" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Description
            </label>
            <input
              type="text"
              id="modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm dark:shadow-none"
              placeholder="e.g., Pizza night, Uber ride, Coffee break..."
            />
          </div>

          <div>
            <label htmlFor="modal-amount" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Amount
            </label>
            <input
              type="number"
              id="modal-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm dark:shadow-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="modal-paidBy" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Paid by
            </label>
            <select
              id="modal-paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="w-full rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-900 dark:text-gray-100 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm dark:shadow-none"
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
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400 border-2 border-red-200/60 dark:border-red-800/60 ring-2 ring-red-100/50 dark:ring-red-900/50">
              {error}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg sm:rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-[0.98] shadow-sm dark:shadow-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim() || !amount}
              className="flex-1 rounded-lg sm:rounded-xl bg-black dark:bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white dark:text-gray-900 shadow-md hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all active:scale-[0.98]"
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

