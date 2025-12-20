import type { SplitType, ExpenseSplit } from '@/lib/types'

export function calculateEqualSplit(
  amount: number,
  memberIds: string[]
): ExpenseSplit[] {
  if (memberIds.length === 0) return []
  
  const splitAmount = amount / memberIds.length
  const roundedSplit = Math.round((splitAmount + Number.EPSILON) * 100) / 100
  
  // Handle rounding errors by adjusting the last split
  const splits: ExpenseSplit[] = memberIds.map((userId, index) => ({
    user_id: userId,
    owed_amount: index === memberIds.length - 1
      ? Math.round((amount - roundedSplit * (memberIds.length - 1) + Number.EPSILON) * 100) / 100
      : roundedSplit,
  }))
  
  return splits
}

export function calculateUnequalSplit(
  amount: number,
  amounts: Record<string, number>
): ExpenseSplit[] {
  return Object.entries(amounts).map(([userId, owedAmount]) => ({
    user_id: userId,
    owed_amount: Math.round((owedAmount + Number.EPSILON) * 100) / 100,
  }))
}

export function calculatePercentageSplit(
  amount: number,
  percentages: Record<string, number>
): ExpenseSplit[] {
  return Object.entries(percentages).map(([userId, percentage]) => ({
    user_id: userId,
    owed_amount: Math.round((amount * (percentage / 100) + Number.EPSILON) * 100) / 100,
  }))
}

export function calculateShareSplit(
  amount: number,
  shares: Record<string, number>
): ExpenseSplit[] {
  const totalShares = Object.values(shares).reduce((sum, share) => sum + share, 0)
  
  if (totalShares === 0) return []
  
  return Object.entries(shares).map(([userId, share]) => ({
    user_id: userId,
    owed_amount: Math.round((amount * (share / totalShares) + Number.EPSILON) * 100) / 100,
  }))
}

export function excludeMembers(
  splits: ExpenseSplit[],
  excludedIds: string[]
): ExpenseSplit[] {
  return splits.filter((split) => !excludedIds.includes(split.user_id))
}

export function normalizeSplits(
  type: SplitType,
  amount: number,
  config: {
    memberIds?: string[]
    amounts?: Record<string, number>
    percentages?: Record<string, number>
    shares?: Record<string, number>
    excludedIds?: string[]
  }
): ExpenseSplit[] {
  let splits: ExpenseSplit[] = []

  switch (type) {
    case 'equal':
      if (!config.memberIds) throw new Error('Member IDs required for equal split')
      splits = calculateEqualSplit(amount, config.memberIds)
      break
    case 'unequal':
      if (!config.amounts) throw new Error('Amounts required for unequal split')
      splits = calculateUnequalSplit(amount, config.amounts)
      break
    case 'percentage':
      if (!config.percentages) throw new Error('Percentages required for percentage split')
      splits = calculatePercentageSplit(amount, config.percentages)
      break
    case 'shares':
      if (!config.shares) throw new Error('Shares required for share-based split')
      splits = calculateShareSplit(amount, config.shares)
      break
    default:
      throw new Error(`Unknown split type: ${type}`)
  }

  // Apply exclusions
  if (config.excludedIds && config.excludedIds.length > 0) {
    splits = excludeMembers(splits, config.excludedIds)
  }

  return splits
}

export function validateSplits(amount: number, splits: ExpenseSplit[]): {
  valid: boolean
  error?: string
} {
  const total = splits.reduce((sum, split) => sum + split.owed_amount, 0)
  const difference = Math.abs(total - amount)
  
  // Allow small rounding differences (0.01)
  if (difference > 0.01) {
    return {
      valid: false,
      error: `Split total (${total.toFixed(2)}) does not match expense amount (${amount.toFixed(2)})`,
    }
  }

  return { valid: true }
}

