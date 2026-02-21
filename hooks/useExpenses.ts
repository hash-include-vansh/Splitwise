'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGroupExpenses, getExpenseDetails, createExpense, updateExpense } from '@/lib/services/expenses-client'
import { queryKeys } from '@/lib/queries/keys'
import type { CreateExpenseData, Expense } from '@/lib/types'

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
    onSuccess: async (expense, variables) => {
      // Immediately invalidate and refetch expenses
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.expenses.list(variables.group_id),
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.balances.all,
          refetchType: 'active'
        })
      ])
      
      // Explicitly refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ 
        queryKey: queryKeys.expenses.list(variables.group_id),
        type: 'active'
      })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ expenseId, data }: { expenseId: string; data: CreateExpenseData }) => {
      const { data: expense, error } = await updateExpense(expenseId, data)
      if (error) throw error
      return expense
    },
    onSuccess: async (expense, variables) => {
      // Invalidate and refetch expenses and balances
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.list(variables.data.group_id),
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenses.detail(variables.expenseId),
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.balances.all,
          refetchType: 'active'
        })
      ])
    },
  })
}

