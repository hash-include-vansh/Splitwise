'use client'

import { createClient } from '@/lib/supabase/client'
import type { RawBalance, SimplifiedDebt, UserNetBalance } from '@/lib/types'
import { simplifyDebts } from '@/lib/utils/debtSimplification'

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

  // Convert to RawBalance array
  const rawBalances: RawBalance[] = []
  rawBalancesMap.forEach((toUserMap, fromUserId) => {
    toUserMap.forEach((amount, toUserId) => {
      if (amount > 0.01) {
        rawBalances.push({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: Math.round((amount + Number.EPSILON) * 100) / 100,
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
  // First calculate net balances
  const { data: netBalances, error: netError } = await calculateNetBalances(groupId)
  if (netError || !netBalances) {
    return { data: null, error: netError || new Error('Failed to calculate net balances') }
  }

  // Simplify debts
  const simplified = simplifyDebts(netBalances)

  // Fetch user details
  const userIds = new Set<string>()
  simplified.forEach((d) => {
    userIds.add(d.from_user_id)
    userIds.add(d.to_user_id)
  })

  if (userIds.size > 0) {
    const supabase = createClient()
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

