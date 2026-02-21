'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Expense, User } from '@/lib/types'
import { EXPENSE_CATEGORIES, getCategoryByKey } from '@/lib/constants/categories'
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react'

interface ExpenseFiltersProps {
  expenses: Expense[]
  onFilteredExpenses: (filtered: Expense[]) => void
  members: { user_id: string; name: string | null; email: string | null }[]
}

type SortBy = 'date' | 'amount'
type SortDir = 'desc' | 'asc'

export function ExpenseFilters({ expenses, onFilteredExpenses, members }: ExpenseFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPaidBy, setSelectedPaidBy] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (selectedCategories.length > 0) count++
    if (selectedPaidBy) count++
    if (dateRange) count++
    return count
  }, [searchQuery, selectedCategories, selectedPaidBy, dateRange])

  // Apply filters and sorting — compute filtered list as a memo
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses]

    // Search by description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => e.description.toLowerCase().includes(query))
    }

    // Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(e => selectedCategories.includes(e.category || 'general'))
    }

    // Filter by paid by
    if (selectedPaidBy) {
      filtered = filtered.filter(e => e.paid_by === selectedPaidBy)
    }

    // Filter by date range
    if (dateRange) {
      const now = new Date()
      let startDate: Date | null = null

      if (dateRange === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (dateRange === 'last-month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        filtered = filtered.filter(e => {
          const d = new Date(e.created_at)
          return d >= startDate! && d <= endDate
        })
        startDate = null // already filtered
      }

      if (startDate) {
        filtered = filtered.filter(e => new Date(e.created_at) >= startDate!)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return sortDir === 'desc' ? diff : -diff
      } else {
        const diff = b.amount - a.amount
        return sortDir === 'desc' ? diff : -diff
      }
    })

    return filtered
  }, [expenses, searchQuery, selectedCategories, selectedPaidBy, dateRange, sortBy, sortDir])

  // Notify parent of filtered results — must be in useEffect, not during render
  useEffect(() => {
    onFilteredExpenses(filteredExpenses)
  }, [filteredExpenses, onFilteredExpenses])

  const clearAll = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setSelectedPaidBy('')
    setDateRange('')
    setSortBy('date')
    setSortDir('desc')
  }

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const toggleSort = () => {
    if (sortBy === 'date' && sortDir === 'desc') {
      setSortDir('asc')
    } else if (sortBy === 'date' && sortDir === 'asc') {
      setSortBy('amount')
      setSortDir('desc')
    } else if (sortBy === 'amount' && sortDir === 'desc') {
      setSortDir('asc')
    } else {
      setSortBy('date')
      setSortDir('desc')
    }
  }

  const sortLabel = sortBy === 'date'
    ? (sortDir === 'desc' ? 'Newest first' : 'Oldest first')
    : (sortDir === 'desc' ? 'Highest first' : 'Lowest first')

  return (
    <div className="space-y-3 mb-4">
      {/* Search bar + filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-8 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] font-bold ${
              showFilters ? 'bg-white text-gray-900 dark:bg-gray-900 dark:text-white' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleSort}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          title={sortLabel}
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">{sortLabel}</span>
        </button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-4 shadow-soft dark:shadow-none">
          {/* Category filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const isSelected = selectedCategories.includes(cat.key)
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? `${cat.bgColor} ${cat.textColor} shadow-sm`
                        : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Paid by filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">Paid by</label>
            <select
              value={selectedPaidBy}
              onChange={(e) => setSelectedPaidBy(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none"
            >
              <option value="">All members</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name || m.email || 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">Date range</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: '', label: 'All time' },
                { key: 'week', label: 'This week' },
                { key: 'month', label: 'This month' },
                { key: 'last-month', label: 'Last month' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDateRange(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dateRange === opt.key
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
