'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Initialize split config based on type
    if (splitType === 'equal' && availableMembers.length > 0) {
      setSplitConfig({ memberIds: availableMembers.map((m) => m.user_id) })
    } else if (splitType === 'unequal') {
      setSplitConfig({
        amounts: Object.fromEntries(
          availableMembers.map((m) => [m.user_id, ''])
        ),
      })
    } else if (splitType === 'percentage') {
      setSplitConfig({
        percentages: Object.fromEntries(
          availableMembers.map((m) => [m.user_id, ''])
        ),
      })
    } else if (splitType === 'shares') {
      setSplitConfig({
        shares: Object.fromEntries(
          availableMembers.map((m) => [m.user_id, '1'])
        ),
      })
    }
  }, [splitType, availableMembers])

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
        .filter(([_, val]) => val !== '' && !isNaN(parseFloat(val as string)))
        .map(([userId, val]) => ({
          user_id: userId,
          owed_amount: parseFloat(val as string),
        }))
    } else if (splitType === 'percentage') {
      const percentages = splitConfig.percentages || {}
      splits = Object.entries(percentages)
        .filter(([_, val]) => val !== '' && !isNaN(parseFloat(val as string)))
        .map(([userId, val]) => ({
          user_id: userId,
          owed_amount: (amountNum * parseFloat(val as string)) / 100,
        }))
    } else if (splitType === 'shares') {
      const shares = splitConfig.shares || {}
      const shareEntries = Object.entries(shares).filter(
        ([_, val]) => val !== '' && !isNaN(parseFloat(val as string))
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
    const validation = validateSplits(amountNum, splits)
    if (!validation.valid) {
      setError(validation.error || 'Invalid split configuration')
      return
    }

    if (splits.length === 0) {
      setError('At least one member must be included in the split')
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

      // Success - redirect to expenses list
      router.push(`/groups/${groupId}/expenses`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., Dinner at restaurant"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0.00"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        members={availableMembers}
        config={splitConfig}
        onConfigChange={setSplitConfig}
        excludedMembers={excludedMembers}
        onExcludedMembersChange={setExcludedMembers}
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !description.trim() || !amount}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Expense'}
        </button>
      </div>
    </form>
  )
}

