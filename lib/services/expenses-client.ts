'use client'

import { createClient } from '@/lib/supabase/client'
import type { Expense, CreateExpenseData } from '@/lib/types'
import { validateSplits } from '@/lib/utils/splitCalculations'

export async function createExpense(
  data: CreateExpenseData
): Promise<{ data: Expense | null; error: Error | null }> {
  const supabase = createClient()

  // All splits are already calculated correctly in the form, use them directly
  // No need to re-normalize as that was causing issues (e.g., treating calculated amounts as percentages)
  const splits = data.splits

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

