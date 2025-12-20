'use client'

import { useQuery } from '@tanstack/react-query'
import {
  calculateRawBalances,
  calculateSimplifiedBalances,
  calculateNetBalances,
} from '@/lib/services/balances-client'
import { queryKeys } from '@/lib/queries/keys'

export function useRawBalances(groupId: string) {
  return useQuery({
    queryKey: queryKeys.balances.raw(groupId),
    queryFn: async () => {
      const { data, error } = await calculateRawBalances(groupId)
      if (error) throw error
      return data || []
    },
  })
}

export function useSimplifiedBalances(groupId: string) {
  return useQuery({
    queryKey: queryKeys.balances.simplified(groupId),
    queryFn: async () => {
      const { data, error } = await calculateSimplifiedBalances(groupId)
      if (error) throw error
      return data || []
    },
  })
}

export function useNetBalances(groupId: string) {
  return useQuery({
    queryKey: queryKeys.balances.net(groupId),
    queryFn: async () => {
      const { data, error } = await calculateNetBalances(groupId)
      if (error) throw error
      return data || []
    },
  })
}

