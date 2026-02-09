import { createClient } from '@/lib/supabase/server'
import type { RawBalance, SimplifiedDebt, UserNetBalance, Payment } from '@/lib/types'
import { simplifyDebts } from '@/lib/utils/debtSimplification'

// Helper function to get accepted payments for a group
async function getAcceptedPayments(groupId: string): Promise<Payment[]> {
  const supabase = await createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'accepted')
  
  return (payments || []) as Payment[]
}

export async function calculateRawBalances(
  groupId: string
): Promise<{ data: RawBalance[] | null; error: Error | null }> {
  const supabase = await createClient()

  // Get all expenses and their splits for the group
  const { data: expenses, error: expensesError } = await supabase
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

  if (expensesError) {
    return { data: null, error: expensesError }
  }

  // Get accepted payments to subtract from balances
  const acceptedPayments = await getAcceptedPayments(groupId)

  // Calculate pairwise debts: debtor → creditor (one direction only)
  // We net opposite directions: if A owes B ₹100 and B owes A ₹30, result is A owes B ₹70
  const pairDebts = new Map<string, number>() // "debtorId|creditorId" → amount

  expenses?.forEach((expense: any) => {
    const payerId = expense.paid_by
    const splits = expense.splits || []

    splits.forEach((split: any) => {
      const oweId = split.user_id
      const amount = split.owed_amount

      if (payerId === oweId) return // skip self

      // oweId owes payerId this amount
      // Check both directions and net them
      const forwardKey = `${oweId}|${payerId}`
      const reverseKey = `${payerId}|${oweId}`

      const forwardAmount = pairDebts.get(forwardKey) || 0
      const reverseAmount = pairDebts.get(reverseKey) || 0

      // Add to the forward direction (oweId → payerId)
      pairDebts.set(forwardKey, forwardAmount + amount)
    })
  })

  // Now net opposite pairs: if A→B = 100 and B→A = 30, result is A→B = 70
  const nettedDebts = new Map<string, number>()
  const processed = new Set<string>()

  pairDebts.forEach((amount, key) => {
    if (processed.has(key)) return

    const [fromId, toId] = key.split('|')
    const reverseKey = `${toId}|${fromId}`
    const reverseAmount = pairDebts.get(reverseKey) || 0

    processed.add(key)
    processed.add(reverseKey)

    const net = amount - reverseAmount
    if (Math.abs(net) > 0.01) {
      if (net > 0) {
        nettedDebts.set(key, net)
      } else {
        nettedDebts.set(reverseKey, Math.abs(net))
      }
    }
  })

  // Build a map of accepted payments by debtor-creditor pair
  const paymentsMap = new Map<string, number>()
  acceptedPayments.forEach((payment) => {
    const key = `${payment.debtor_id}|${payment.creditor_id}`
    const current = paymentsMap.get(key) || 0
    paymentsMap.set(key, current + payment.amount)
  })

  // Convert to RawBalance array with payment tracking
  const rawBalances: RawBalance[] = []
  nettedDebts.forEach((originalAmount, key) => {
    const [fromUserId, toUserId] = key.split('|')
    const paidAmount = paymentsMap.get(key) || 0
    const remainingAmount = originalAmount - paidAmount
    const isSettled = remainingAmount <= 0.01

    if (originalAmount > 0.01) {
      rawBalances.push({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: Math.max(0, Math.round((remainingAmount + Number.EPSILON) * 100) / 100),
        originalAmount: Math.round((originalAmount + Number.EPSILON) * 100) / 100,
        paidAmount: Math.round((paidAmount + Number.EPSILON) * 100) / 100,
        isSettled,
      })
    }
  })

  // Fetch user details
  const userIds = new Set<string>()
  rawBalances.forEach((b) => {
    userIds.add(b.from_user_id)
    userIds.add(b.to_user_id)
  })

  if (userIds.size > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', Array.from(userIds))

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])

    rawBalances.forEach((balance) => {
      balance.from_user = userMap.get(balance.from_user_id) || undefined
      balance.to_user = userMap.get(balance.to_user_id) || undefined
    })
  }

  return { data: rawBalances, error: null }
}

export async function calculateSimplifiedBalances(
  groupId: string
): Promise<{ data: SimplifiedDebt[] | null; error: Error | null }> {
  // Use raw pairwise balances as source of truth.
  // Simplification is ONLY used when no payments exist yet.
  // Once payments start, we show raw pairwise debts to avoid phantom debts.

  const { data: rawBalances, error: rawError } = await calculateRawBalances(groupId)
  if (rawError || !rawBalances) {
    return { data: null, error: rawError || new Error('Failed to calculate balances') }
  }

  const hasAnyPayments = rawBalances.some(b => (b.paidAmount || 0) > 0.01)

  if (hasAnyPayments) {
    // Payments exist — show raw pairwise debts as-is
    const debts: SimplifiedDebt[] = rawBalances.map(b => ({
      from_user_id: b.from_user_id,
      to_user_id: b.to_user_id,
      amount: b.amount,
      originalAmount: b.originalAmount,
      paidAmount: b.paidAmount,
      isSettled: b.isSettled,
      from_user: b.from_user,
      to_user: b.to_user,
    }))
    return { data: debts, error: null }
  }

  // No payments yet — use simplification algorithm
  const { data: netBalances, error: netError } = await calculateNetBalances(groupId)
  if (netError || !netBalances) {
    return { data: null, error: netError || new Error('Failed to calculate net balances') }
  }

  const simplified = simplifyDebts(netBalances)

  // Fetch user details
  const userIds = new Set<string>()
  simplified.forEach((d) => {
    userIds.add(d.from_user_id)
    userIds.add(d.to_user_id)
  })

  if (userIds.size > 0) {
    const supabase = await createClient()
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', Array.from(userIds))

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])

    simplified.forEach((debt) => {
      debt.from_user = userMap.get(debt.from_user_id) || undefined
      debt.to_user = userMap.get(debt.to_user_id) || undefined
    })
  }

  return { data: simplified, error: null }
}

export async function calculateNetBalances(
  groupId: string
): Promise<{ data: UserNetBalance[] | null; error: Error | null }> {
  const supabase = await createClient()

  // Get all expenses and their splits
  const { data: expenses, error: expensesError } = await supabase
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

  if (expensesError) {
    return { data: null, error: expensesError }
  }

  // Get accepted payments to subtract from balances
  const acceptedPayments = await getAcceptedPayments(groupId)

  // Calculate net balance per user
  const netBalances: Map<string, number> = new Map()

  expenses?.forEach((expense: any) => {
    const payerId = expense.paid_by
    const splits = expense.splits || []

    // Calculate what others owe the payer (excluding payer's own share)
    const othersOwe = splits
      .filter((split: any) => split.user_id !== payerId)
      .reduce((sum: number, split: any) => sum + split.owed_amount, 0)

    // Payer is credited with what others owe them
    const currentPayer = netBalances.get(payerId) || 0
    netBalances.set(payerId, currentPayer + othersOwe)

    // Subtract what each person owes (excluding payer's own share)
    splits.forEach((split: any) => {
      const oweId = split.user_id
      const amount = split.owed_amount

      if (payerId === oweId) {
        return
      }

      const currentOwe = netBalances.get(oweId) || 0
      netBalances.set(oweId, currentOwe - amount)
    })
  })

  // Apply accepted payments to net balances
  // When debtor pays creditor:
  // - Debtor's net balance increases (less negative / more positive)
  // - Creditor's net balance decreases (less positive / more negative)
  acceptedPayments.forEach((payment) => {
    const debtorBalance = netBalances.get(payment.debtor_id) || 0
    const creditorBalance = netBalances.get(payment.creditor_id) || 0
    
    netBalances.set(payment.debtor_id, debtorBalance + payment.amount)
    netBalances.set(payment.creditor_id, creditorBalance - payment.amount)
  })

  // Convert to UserNetBalance array
  const userNetBalances: UserNetBalance[] = Array.from(netBalances.entries())
    .filter(([_, balance]) => Math.abs(balance) > 0.01) // Only include non-zero balances
    .map(([userId, balance]) => ({
      user_id: userId,
      net_balance: Math.round((balance + Number.EPSILON) * 100) / 100,
    }))

  // Fetch user details
  if (userNetBalances.length > 0) {
    const userIds = userNetBalances.map((b) => b.user_id)
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])

    userNetBalances.forEach((balance) => {
      balance.user = userMap.get(balance.user_id) || undefined
    })
  }

  return { data: userNetBalances, error: null }
}

export async function getUserNetBalance(
  groupId: string,
  userId: string
): Promise<{ data: number | null; error: Error | null }> {
  const { data: netBalances, error } = await calculateNetBalances(groupId)
  if (error || !netBalances) {
    return { data: null, error: error || new Error('Failed to calculate net balance') }
  }

  const userBalance = netBalances.find((b) => b.user_id === userId)
  return { data: userBalance?.net_balance || 0, error: null }
}

