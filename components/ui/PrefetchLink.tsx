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

  const prefetchExpenseDetail = async (groupId: string, expenseId: string) => {
    const supabase = createClient()
    
    // Prefetch expense detail data - no caching, always fresh
    queryClient.prefetchQuery({
      queryKey: queryKeys.expenses.detail(expenseId),
      queryFn: async () => {
        // Get expense
        const { data: expense, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', expenseId)
          .single()

        if (expenseError || !expense) throw expenseError || new Error('Expense not found')

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
          ...expense,
          paid_by_user: paidByUser || null,
          splits: splits?.map((split: any) => ({
            ...split,
            user: split.user || null,
          })) || [],
        }
      },
      staleTime: 0, // No caching - always fresh
      gcTime: 0, // Don't cache
    })
  }

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
      staleTime: 0, // No caching - always fresh
      gcTime: 0, // Don't cache
    })
  }

  const handleMouseEnter = () => {
    if (prefetch) {
      // Check if it's an expense detail page
      const expenseDetailMatch = href.match(/\/groups\/([^/]+)\/expenses\/([^/]+)/)
      if (expenseDetailMatch) {
        const [, groupId, expenseId] = expenseDetailMatch
        prefetchExpenseDetail(groupId, expenseId)
      } 
      // Check if it's expenses list page
      else if (href.includes('/expenses') && !href.includes('/expenses/')) {
        const match = href.match(/\/groups\/([^/]+)\/expenses/)
        if (match) {
          const groupId = match[1]
          prefetchExpenses(groupId)
        }
      }
    }
    props.onMouseEnter?.()
  }

  const handleTouchStart = () => {
    // On mobile, prefetch on touch start (before click)
    if (prefetch) {
      // Check if it's an expense detail page
      const expenseDetailMatch = href.match(/\/groups\/([^/]+)\/expenses\/([^/]+)/)
      if (expenseDetailMatch) {
        const [, groupId, expenseId] = expenseDetailMatch
        prefetchExpenseDetail(groupId, expenseId)
      }
      // Check if it's expenses list page
      else if (href.includes('/expenses') && !href.includes('/expenses/')) {
        const match = href.match(/\/groups\/([^/]+)\/expenses/)
        if (match) {
          const groupId = match[1]
          prefetchExpenses(groupId)
        }
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

