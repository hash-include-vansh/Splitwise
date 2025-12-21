'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGroupExpenses, getExpenseDetails } from '@/lib/services/expenses-client'
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
    staleTime: 0, // Data is immediately stale - always refetch
    gcTime: 0, // Don't cache - remove from cache immediately when unused
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
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
    staleTime: 0, // Data is immediately stale - always refetch
    gcTime: 0, // Don't cache - remove from cache immediately when unused
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
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
    onSuccess: (expense, variables) => {
      // Immediately invalidate and refetch expenses
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.expenses.list(variables.group_id),
        refetchType: 'active' // Only refetch active queries
      })
      // Invalidate balances
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.balances.all,
        refetchType: 'active'
      })
    },
  })
}

