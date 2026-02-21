'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBulkPayments, sendPaymentReminder } from '@/lib/services/payments-client'
import type { BulkPaymentItem } from '@/lib/services/payments-client'
import { queryKeys } from '@/lib/queries/keys'

export function useBulkPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, payments }: { groupId: string; payments: BulkPaymentItem[] }) => {
      const { data, error } = await createBulkPayments(groupId, payments)
      if (error) throw error
      return data
    },
    onSuccess: async (_, variables) => {
      // Invalidate and refetch balances and payments
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.balances.all,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments.all,
          refetchType: 'active',
        }),
      ])
    },
  })
}

export function useSendReminder() {
  return useMutation({
    mutationFn: async ({
      groupId,
      debtorId,
      creditorId,
      amount,
    }: {
      groupId: string
      debtorId: string
      creditorId: string
      amount: number
    }) => {
      const { data, error } = await sendPaymentReminder(groupId, debtorId, creditorId, amount)
      if (error) throw error
      return data
    },
  })
}
