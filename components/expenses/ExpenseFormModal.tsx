'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense } from '@/lib/services/expenses-client'
import { SplitTypeSelector } from './SplitTypeSelector'
import { SplitConfigurator } from './SplitConfigurator'
import { validateSplits } from '@/lib/utils/splitCalculations'
import type { GroupMember, SplitType } from '@/lib/types'
import { X } from 'lucide-react'

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
  const [description, setDescription] = useState(initialData?.description || '')
  const [amount, setAmount] = useState(
    initialData?.amount?.toString() || ''
  )
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setLoading(true)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.')
      setLoading(false)
      return
    }

    if (availableMemberIds.length === 0) {
      setError('Please include at least one member in the split.')
      setLoading(false)
      return
    }

    let splits: { user_id: string; owed_amount: number }[] = []

    if (splitType === 'equal') {
      const share = amountNum / availableMemberIds.length
      splits = availableMemberIds.map((userId) => ({
        user_id: userId,
        owed_amount: Math.round((share + Number.EPSILON) * 100) / 100,
      }))
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
      splits = availableMemberIds
        .map((userId) => {
          const percentage = parseFloat(percentages[userId] || '0')
          return {
            user_id: userId,
            owed_amount: Math.round((amountNum * percentage / 100 + Number.EPSILON) * 100) / 100,
          }
        })
        .filter((s) => s.owed_amount > 0)
    } else if (splitType === 'shares') {
      const shares = splitConfig.shares || {}
      const totalShares = availableMemberIds.reduce(
        (sum, userId) => sum + parseFloat(shares[userId] || '0'),
        0
      )
      if (totalShares === 0) {
        setError('Total shares cannot be zero.')
        setLoading(false)
        return
      }
      splits = availableMemberIds.map((userId) => ({
        user_id: userId,
        owed_amount: Math.round((amountNum * parseFloat(shares[userId] || '0') / totalShares + Number.EPSILON) * 100) / 100,
      }))
    }

    const validationResult = validateSplits(amountNum, splits)
    if (!validationResult.valid) {
      setError(validationResult.error || 'Invalid split configuration')
      setLoading(false)
      return
    }

    try {
      const { error: createError } = await createExpense({
        group_id: groupId,
        description,
        amount: amountNum,
        paid_by: paidBy,
        splits,
      })

      if (createError) {
        setError(createError.message || 'Failed to create expense')
        return
      }

      window.location.href = `/groups/${groupId}/expenses`
    } catch (err: any) {
      console.error('Unexpected error creating expense:', err)
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-gray-200/60 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            Review Expense
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="modal-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="modal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all shadow-sm"
              placeholder="e.g., Pizza night, Uber ride, Coffee break..."
            />
          </div>

          <div>
            <label htmlFor="modal-amount" className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all shadow-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="modal-paidBy" className="block text-sm font-medium text-gray-700 mb-2">
              Paid by
            </label>
            <select
              id="modal-paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all shadow-sm"
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
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border-2 border-red-200/60 ring-2 ring-red-100/50">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-[0.98] shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim() || !amount}
              className="flex-1 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all active:scale-[0.98]"
            >
              {loading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

