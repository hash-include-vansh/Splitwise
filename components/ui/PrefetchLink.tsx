'use client'

import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queries/keys'
import { createClient } from '@/lib/supabase/client'
import type { ReactNode } from 'react'

interface PrefetchLinkProps {
  href: string
  children: ReactNode
  className?: string
  prefetch?: boolean
  onMouseEnter?: () => void
  onClick?: () => void
}

export function PrefetchLink({ 
  href, 
  children, 
  className,
  prefetch = true,
  ...props 
}: PrefetchLinkProps) {
  const queryClient = useQueryClient()

  const prefetchExpenses = async (groupId: string) => {
    const supabase = createClient()
    
    // Prefetch expenses data using client-side Supabase
    queryClient.prefetchQuery({
      queryKey: queryKeys.expenses.list(groupId),
      queryFn: async () => {
        // Get expenses
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })

        if (expensesError) throw expensesError
        if (!expenses || expenses.length === 0) return []

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
        return expenses.map((expense: any) => ({
          ...expense,
          paid_by_user: userMap.get(expense.paid_by) || null,
          splits: splitsMap.get(expense.id)?.map((split: any) => ({
            ...split,
            user: split.user || null,
          })) || [],
        }))
      },
      staleTime: 5 * 60 * 1000,
    })
  }

  const handleMouseEnter = () => {
    if (prefetch && href.includes('/expenses')) {
      // Extract groupId from href
      const match = href.match(/\/groups\/([^/]+)\/expenses/)
      if (match) {
        const groupId = match[1]
        prefetchExpenses(groupId)
      }
    }
    props.onMouseEnter?.()
  }

  const handleTouchStart = () => {
    // On mobile, prefetch on touch start (before click)
    if (prefetch && href.includes('/expenses')) {
      const match = href.match(/\/groups\/([^/]+)\/expenses/)
      if (match) {
        const groupId = match[1]
        prefetchExpenses(groupId)
      }
    }
  }

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </Link>
  )
}

