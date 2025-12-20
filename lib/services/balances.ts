import { createClient } from '@/lib/supabase/server'
import type { RawBalance, SimplifiedDebt, UserNetBalance } from '@/lib/types'
import { simplifyDebts } from '@/lib/utils/debtSimplification'

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

  // Calculate balances: payer is credited, others owe
  const balances: Map<string, Map<string, number>> = new Map()

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
      if (!balances.has(payerId)) {
        balances.set(payerId, new Map())
      }
      if (!balances.has(oweId)) {
        balances.set(oweId, new Map())
      }

      const payerBalances = balances.get(payerId)!
      const oweBalances = balances.get(oweId)!

      // Payer is owed money (positive)
      const currentPayer = payerBalances.get(oweId) || 0
      payerBalances.set(oweId, currentPayer + amount)

      // Owe person owes money (negative)
      const currentOwe = oweBalances.get(payerId) || 0
      oweBalances.set(payerId, currentOwe - amount)
    })
  })

  // Convert to RawBalance array
  const rawBalances: RawBalance[] = []
  balances.forEach((oweMap, fromUserId) => {
    oweMap.forEach((amount, toUserId) => {
      if (Math.abs(amount) > 0.01) {
        // Only include non-zero balances
        rawBalances.push({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100,
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

  // Calculate net balance per user
  const netBalances: Map<string, number> = new Map()

  expenses?.forEach((expense: any) => {
    const payerId = expense.paid_by
    const splits = expense.splits || []

    // Payer is credited with full amount
    const currentPayer = netBalances.get(payerId) || 0
    netBalances.set(payerId, currentPayer + expense.amount)

    // Others owe their split amounts
    splits.forEach((split: any) => {
      const oweId = split.user_id
      const amount = split.owed_amount

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

