'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserGroups, getGroupDetails, removeMember } from '@/lib/services/groups'
import { createGroup } from '@/lib/services/groups-client'
import { queryKeys } from '@/lib/queries/keys'
import { useAuth } from './useAuth'

export function useUserGroups() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.groups.list(user?.id || ''),
    queryFn: async () => {
      if (!user) return []
      const { data } = await getUserGroups(user.id)
      return data || []
    },
    enabled: !!user,
  })
}

export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const { data, error } = await getGroupDetails(groupId)
      if (error) throw error
      return data
    },
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await createGroup(name, user.id)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups.list(user.id) })
      }
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      requesterId,
    }: {
      groupId: string
      userId: string
      requesterId: string
    }) => {
      const { error } = await removeMember(groupId, userId, requesterId)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.groupId) })
    },
  })
}

