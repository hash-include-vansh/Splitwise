import { createClient } from '@/lib/supabase/server'
import type { Expense, ExpenseSplitDetail, CreateExpenseData } from '@/lib/types'
import { normalizeSplits, validateSplits } from '@/lib/utils/splitCalculations'

export async function createExpense(
  data: CreateExpenseData
): Promise<{ data: Expense | null; error: Error | null }> {
  const supabase = await createClient()

  // Normalize splits based on type
  const splits = normalizeSplits(data.split_type, data.amount, {
    memberIds: data.splits.map((s) => s.user_id),
    amounts: data.split_type === 'unequal'
      ? Object.fromEntries(data.splits.map((s) => [s.user_id, s.owed_amount]))
      : undefined,
    percentages:
      data.split_type === 'percentage'
        ? Object.fromEntries(data.splits.map((s) => [s.user_id, s.owed_amount]))
        : undefined,
    shares:
      data.split_type === 'shares'
        ? Object.fromEntries(data.splits.map((s) => [s.user_id, s.owed_amount]))
        : undefined,
    excludedIds: data.excluded_members,
  })

  // Validate splits
  const validation = validateSplits(data.amount, splits)
  if (!validation.valid) {
    return { data: null, error: new Error(validation.error || 'Invalid splits') }
  }

  // Create expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      group_id: data.group_id,
      paid_by: data.paid_by,
      amount: data.amount,
      description: data.description,
    })
    .select()
    .single()

  if (expenseError || !expense) {
    return { data: null, error: expenseError || new Error('Failed to create expense') }
  }

  // Create expense splits
  const { error: splitsError } = await supabase.from('expense_splits').insert(
    splits.map((split) => ({
      expense_id: expense.id,
      user_id: split.user_id,
      owed_amount: split.owed_amount,
    }))
  )

  if (splitsError) {
    // Rollback expense creation
    await supabase.from('expenses').delete().eq('id', expense.id)
    return { data: null, error: splitsError }
  }

  return { data: expense as Expense, error: null }
}

export async function getGroupExpenses(
  groupId: string
): Promise<{ data: Expense[] | null; error: Error | null }> {
  const supabase = await createClient()

  try {
    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (expensesError) {
      return { data: null, error: expensesError }
    }

    if (!expenses || expenses.length === 0) {
      return { data: [], error: null }
    }

    // Get all user IDs
    const userIds = new Set<string>()
    expenses.forEach((exp: any) => {
      userIds.add(exp.paid_by)
    })

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', Array.from(userIds))

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])

    // Get all splits
    const expenseIds = expenses.map((e: any) => e.id)
    const { data: allSplits } = await supabase
      .from('expense_splits')
      .select(`
        *,
        user:users (*)
      `)
      .in('expense_id', expenseIds)

    // Group splits by expense
    const splitsMap = new Map<string, any[]>()
    allSplits?.forEach((split: any) => {
      if (!splitsMap.has(split.expense_id)) {
        splitsMap.set(split.expense_id, [])
      }
      splitsMap.get(split.expense_id)!.push(split)
    })

    // Combine everything
    return {
      data: expenses.map((expense: any) => ({
        ...expense,
        paid_by_user: userMap.get(expense.paid_by) || null,
        splits: splitsMap.get(expense.id)?.map((split: any) => ({
          ...split,
          user: split.user || null,
        })) || [],
      })) as Expense[],
      error: null,
    }
  } catch (err: any) {
    console.error('Unexpected error in getGroupExpenses:', err)
    return { data: null, error: new Error(err?.message || 'Failed to fetch expenses') }
  }
}

export async function getExpenseDetails(
  expenseId: string
): Promise<{ data: Expense | null; error: Error | null }> {
  const supabase = await createClient()

  try {
    // First get the expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .single()

    if (expenseError || !expense) {
      return { data: null, error: expenseError || new Error('Expense not found') }
    }

    // Get paid_by user
    const { data: paidByUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', expense.paid_by)
      .single()

    // Get splits with users
    const { data: splits } = await supabase
      .from('expense_splits')
      .select(`
        *,
        user:users (*)
      `)
      .eq('expense_id', expenseId)

    return {
      data: {
        ...expense,
        paid_by_user: paidByUser || null,
        splits: splits?.map((split: any) => ({
          ...split,
          user: split.user || null,
        })) || [],
      } as Expense,
      error: null,
    }
  } catch (err: any) {
    console.error('Unexpected error in getExpenseDetails:', err)
    return { data: null, error: new Error(err?.message || 'Failed to fetch expense details') }
  }
}

