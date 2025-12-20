'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGroupExpenses, getExpenseDetails } from '@/lib/services/expenses'
import { createExpense } from '@/lib/services/expenses-client'
import { queryKeys } from '@/lib/queries/keys'
import type { CreateExpenseData } from '@/lib/types'

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: queryKeys.expenses.list(groupId),
    queryFn: async () => {
      const { data, error } = await getGroupExpenses(groupId)
      if (error) throw error
      return data || []
    },
  })
}

export function useExpenseDetails(expenseId: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId),
    queryFn: async () => {
      const { data, error } = await getExpenseDetails(expenseId)
      if (error) throw error
      return data
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const { data: expense, error } = await createExpense(data)
      if (error) throw error
      return expense
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list(variables.group_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all })
    },
  })
}

