'use client'

import { createClient } from '@/lib/supabase/client'
import type { RawBalance, SimplifiedDebt, UserNetBalance, Payment } from '@/lib/types'
import { simplifyDebts } from '@/lib/utils/debtSimplification'

// Helper function to get accepted payments for a group
// Returns empty array if payments table doesn't exist yet
async function getAcceptedPayments(groupId: string): Promise<Payment[]> {
  try {
    const supabase = createClient()
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'accepted')
    
    // If table doesn't exist, just return empty array
    if (error) {
      console.log('Payments table not available:', error.message)
      return []
    }
    
    return (payments || []) as Payment[]
  } catch (err) {
    console.log('Error fetching payments:', err)
    return []
  }
}

export async function calculateRawBalances(
  groupId: string
): Promise<{ data: RawBalance[] | null; error: Error | null }> {
  const supabase = createClient()

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

  // Calculate raw balances: track all pairwise debts from each expense
  // This shows who owes whom from each individual expense
  const rawBalancesMap = new Map<string, Map<string, number>>() // from_user_id -> to_user_id -> amount

  expenses?.forEach((expense: any) => {
    const payerId = expense.paid_by
    const splits = expense.splits || []

    splits.forEach((split: any) => {
      const oweId = split.user_id
      const amount = split.owed_amount

      if (payerId === oweId) {
        // Person paid for themselves, no balance change
        return
      }

      // Initialize maps if needed
      if (!rawBalancesMap.has(oweId)) {
        rawBalancesMap.set(oweId, new Map())
      }

      const oweBalances = rawBalancesMap.get(oweId)!
      
      // Track that oweId owes payerId this amount
      const currentAmount = oweBalances.get(payerId) || 0
      oweBalances.set(payerId, currentAmount + amount)
    })
  })

  // Build a map of payments by debtor-creditor pair
  const paymentsMap = new Map<string, number>()
  acceptedPayments.forEach((payment) => {
    const key = `${payment.debtor_id}|${payment.creditor_id}`
    const current = paymentsMap.get(key) || 0
    paymentsMap.set(key, current + payment.amount)
  })

  // Convert to RawBalance array (include settled balances too)
  const rawBalances: RawBalance[] = []
  rawBalancesMap.forEach((toUserMap, fromUserId) => {
    toUserMap.forEach((originalAmount, toUserId) => {
      if (originalAmount > 0.01) {
        const paidKey = `${fromUserId}|${toUserId}`
        const paidAmount = paymentsMap.get(paidKey) || 0
        const remainingAmount = originalAmount - paidAmount
        const isSettled = remainingAmount <= 0.01
        
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
  })

  // Fetch user details
  const userIds = new Set<string>()
  rawBalances.forEach((b) => {
    userIds.add(b.from_user_id)
    userIds.add(b.to_user_id)
  })

  if (userIds.size > 0) {
    const supabase = createClient()
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
  const supabase = createClient()
  
  // First calculate net balances
  const { data: netBalances, error: netError } = await calculateNetBalances(groupId)
  if (netError || !netBalances) {
    return { data: null, error: netError || new Error('Failed to calculate net balances') }
  }

  // Simplify debts (active, non-zero balances)
  const simplified = simplifyDebts(netBalances)

  // Also fetch settled payments to show as settled balances
  let settledBalances: SimplifiedDebt[] = []
  try {
    // Get all accepted payments grouped by debtor-creditor pair
    const { data: payments } = await supabase
      .from('payments')
      .select('debtor_id, creditor_id, amount')
      .eq('group_id', groupId)
      .eq('status', 'accepted')
    
    if (payments && payments.length > 0) {
      // Group payments by debtor-creditor pair
      const settledMap = new Map<string, { debtorId: string, creditorId: string, amount: number }>()
      
      payments.forEach((p: any) => {
        const key = `${p.debtor_id}|${p.creditor_id}`
        const existing = settledMap.get(key) || { debtorId: p.debtor_id, creditorId: p.creditor_id, amount: 0 }
        existing.amount += p.amount
        settledMap.set(key, existing)
      })
      
      // Check which ones are fully settled (not in active simplified debts)
      settledMap.forEach((settled) => {
        // Check if this pair exists in active debts
        const activeDebt = simplified.find(
          d => d.from_user_id === settled.debtorId && d.to_user_id === settled.creditorId
        )
        
        // If no active debt, this is a fully settled balance
        if (!activeDebt) {
          settledBalances.push({
            from_user_id: settled.debtorId,
            to_user_id: settled.creditorId,
            amount: 0,
            originalAmount: settled.amount,
            paidAmount: settled.amount,
            isSettled: true,
          })
        }
      })
    }
  } catch (err) {
    // Ignore errors from payments table - just don't show settled balances
    console.log('Could not fetch settled payments:', err)
  }

  // Combine active and settled balances
  const allDebts = [...simplified, ...settledBalances]

  // Fetch user details
  const userIds = new Set<string>()
  allDebts.forEach((d) => {
    userIds.add(d.from_user_id)
    userIds.add(d.to_user_id)
  })

  if (userIds.size > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', Array.from(userIds))

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])

    allDebts.forEach((debt) => {
      debt.from_user = userMap.get(debt.from_user_id) || undefined
      debt.to_user = userMap.get(debt.to_user_id) || undefined
    })
  }

  return { data: allDebts, error: null }
}

export async function calculateNetBalances(
  groupId: string
): Promise<{ data: UserNetBalance[] | null; error: Error | null }> {
  const supabase = createClient()

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
  // Rule: Never include "owes to self" - a person's own share doesn't affect their net balance
  const netBalances: Map<string, number> = new Map()

  expenses?.forEach((expense: any) => {
    const payerId = expense.paid_by
    const splits = expense.splits || []

    // Calculate what others owe the payer (excluding payer's own share)
    const othersOwe = splits
      .filter((split: any) => split.user_id !== payerId)
      .reduce((sum: number, split: any) => sum + split.owed_amount, 0)

    // Payer is credited with what others owe them (not the full amount)
    const currentPayer = netBalances.get(payerId) || 0
    netBalances.set(payerId, currentPayer + othersOwe)

    // Subtract what each person owes (excluding payer's own share)
    splits.forEach((split: any) => {
      const oweId = split.user_id
      const amount = split.owed_amount

      // Skip if person owes themselves (their own share)
      if (payerId === oweId) {
        return
      }

      const currentOwe = netBalances.get(oweId) || 0
      netBalances.set(oweId, currentOwe - amount)
    })
  })

  // Apply accepted payments to net balances
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

