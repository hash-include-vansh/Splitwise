'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup, updateGroup, leaveGroup, getUserGroups, getGroupDetails, removeMember } from '@/lib/services/groups-client'
import { queryKeys } from '@/lib/queries/keys'
import { useAuth } from './useAuth'
import type { Group, GroupMember } from '@/lib/types'

export function useUserGroups(initialData?: Group[]) {
  const { user } = useAuth()

  return useQuery({
    // Use a stable key that doesn't change when useAuth resolves.
    // Previously used user?.id which starts as '' (user is null on mount)
    // then switches to the real ID — creating two different cache entries
    // and losing the initialData.
    queryKey: queryKeys.groups.lists(),
    queryFn: async () => {
      if (!user) return []
      const { data } = await getUserGroups(user.id)
      return data || []
    },
    enabled: !!user,
    // When initialData is provided (from server), seed the cache with it
    // and mark it as already stale so React Query refetches immediately on mount.
    // This ensures we show server data instantly but also pick up any mutations
    // that happened on other pages (e.g. group name/emoji changed in settings).
    ...(initialData ? { initialData, staleTime: 0 } : {}),
  })
}

export function useGroupDetails(groupId: string, initialData?: (Group & { members: GroupMember[] }) | null) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const { data, error } = await getGroupDetails(groupId)
      if (error) throw error
      return data
    },
    // When initialData is provided (from server), seed the cache and mark as stale
    // so React Query refetches on mount to pick up changes from settings page.
    ...(initialData ? { initialData, staleTime: 0 } : {}),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, name, emoji }: { groupId: string; name: string; emoji?: string }) => {
      const { data, error } = await updateGroup(groupId, name, emoji)
      if (error && !data) throw error // Only throw if no data returned at all
      return data
    },
    onSuccess: async (updatedGroup) => {
      if (updatedGroup) {
        // 1. Immediately update the group detail cache with the new data.
        //    This is synchronous and guarantees the detail page shows fresh data.
        queryClient.setQueryData(
          queryKeys.groups.detail(updatedGroup.id),
          (old: any) => old ? { ...old, name: updatedGroup.name, emoji: updatedGroup.emoji } : old
        )

        // 2. Immediately update the groups list cache so the list page shows fresh data.
        queryClient.setQueryData(
          queryKeys.groups.lists(),
          (old: Group[] | undefined) =>
            old?.map((g) => g.id === updatedGroup.id ? { ...g, name: updatedGroup.name, emoji: updatedGroup.emoji } : g)
        )
      }

      // 3. Also invalidate to ensure full freshness on next mount
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      })
    },
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await leaveGroup(groupId)
      if (error) throw error
    },
    onSuccess: async () => {
      // Invalidate all group queries so the groups list and any detail pages update
      await queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      })
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

