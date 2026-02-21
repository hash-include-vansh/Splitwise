'use client'

import { useMemo } from 'react'
import { useGroupExpenses } from '@/hooks/useExpenses'
import { useGroupDetails } from '@/hooks/useGroups'
import { getCategoryByKey } from '@/lib/constants/categories'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { BarChart3, TrendingUp, Calendar, Flame, Trophy, Target, Zap, Lightbulb } from 'lucide-react'
import type { Expense } from '@/lib/types'

// ---------------------------------------------------------------------------
// Animated counter component
// ---------------------------------------------------------------------------
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 1.5,
  decimals = 0,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN')
  )

  useEffect(() => {
    if (inView) {
      const controls = animate(motionVal, value, {
        duration,
        ease: 'easeOut',
      })
      return controls.stop
    }
  }, [inView, value, duration, motionVal])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Stagger container / item variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>
      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-elegant"
          >
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
        ))}
      </div>
      {/* Stat cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-elegant"
          >
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4" />
            <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ groupName }: { groupName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 mb-6 shadow-lg">
        <BarChart3 className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
        No expenses yet!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md text-base sm:text-lg leading-relaxed">
        Add some expenses to <span className="font-semibold">{groupName}</span> and come back here for cool analytics, fun insights, and bragging rights.
      </p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Stat Card wrapper
// ---------------------------------------------------------------------------
function StatCard({
  children,
  className = '',
  colSpan = '',
}: {
  children: React.ReactNode
  className?: string
  colSpan?: string
}) {
  return (
    <motion.div
      variants={cardVariants}
      className={`rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-elegant hover:shadow-medium transition-shadow duration-300 overflow-hidden ${colSpan} ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Monthly trend bar chart
// ---------------------------------------------------------------------------
function MonthlyTrend({ expenses }: { expenses: Expense[] }) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    const months: { label: string; total: number; month: number; year: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        total: 0,
        month: d.getMonth(),
        year: d.getFullYear(),
      })
    }

    expenses.forEach((exp) => {
      const d = new Date(exp.created_at)
      const m = months.find((mo) => mo.month === d.getMonth() && mo.year === d.getFullYear())
      if (m) m.total += exp.amount
    })

    return months
  }, [expenses])

  const maxVal = Math.max(...monthlyData.map((m) => m.total), 1)

  const BAR_HEIGHT = 140

  return (
    <div className="flex items-end gap-2 sm:gap-4 pt-2">
      {monthlyData.map((m, i) => {
        const pct = (m.total / maxVal) * 100
        const barPx = pct > 0 ? Math.max((pct / 100) * BAR_HEIGHT, 6) : 0
        return (
          <div key={m.label + m.year} className="flex-1 flex flex-col items-center gap-1.5">
            {/* Value label above bar */}
            <span className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 tabular-nums" style={{ minHeight: '1rem' }}>
              {m.total > 0
                ? m.total >= 1000
                  ? `${(m.total / 1000).toFixed(m.total >= 10000 ? 0 : 1)}k`
                  : `${Math.round(m.total)}`
                : ''}
            </span>
            {/* Bar track — fixed pixel height so bars render correctly */}
            <div
              className="w-full relative rounded-t-lg bg-gray-100 dark:bg-gray-800/70"
              style={{ height: BAR_HEIGHT }}
            >
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-500"
                initial={{ height: 0 }}
                animate={{ height: barPx }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            {/* Month label */}
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
              {m.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main analytics client
// ---------------------------------------------------------------------------
interface AnalyticsPageClientProps {
  groupId: string
  groupName: string
}

export function AnalyticsPageClient({ groupId, groupName }: AnalyticsPageClientProps) {
  const { data: expenses, isLoading: expensesLoading } = useGroupExpenses(groupId)
  const { data: groupDetails, isLoading: groupLoading } = useGroupDetails(groupId)

  const isLoading = expensesLoading || groupLoading
  const allExpenses = useMemo(() => (expenses || []).filter((e) => !e.simplified), [expenses])
  const members = groupDetails?.members || []

  // ---- Computed analytics ------------------------------------------------
  const analytics = useMemo(() => {
    if (allExpenses.length === 0) return null

    // -- Big Spender: who paid the most total
    const paidByMap = new Map<string, { name: string; total: number }>()
    allExpenses.forEach((e) => {
      const id = e.paid_by
      const name = e.paid_by_user?.name || e.paid_by_user?.email || 'Unknown'
      const existing = paidByMap.get(id)
      if (existing) {
        existing.total += e.amount
      } else {
        paidByMap.set(id, { name, total: e.amount })
      }
    })
    const bigSpender = [...paidByMap.entries()].sort((a, b) => b[1].total - a[1].total)[0]

    // -- Expense King/Queen: most individual expenses created
    const countByMap = new Map<string, { name: string; count: number }>()
    allExpenses.forEach((e) => {
      const id = e.paid_by
      const name = e.paid_by_user?.name || e.paid_by_user?.email || 'Unknown'
      const existing = countByMap.get(id)
      if (existing) {
        existing.count += 1
      } else {
        countByMap.set(id, { name, count: 1 })
      }
    })
    const expenseKing = [...countByMap.entries()].sort((a, b) => b[1].count - a[1].count)[0]

    // -- Category Champion
    const categoryCount = new Map<string, number>()
    allExpenses.forEach((e) => {
      const cat = e.category || 'general'
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
    })
    const topCategory = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]
    const topCategoryInfo = getCategoryByKey(topCategory?.[0])

    const categoryTaglines: Record<string, string> = {
      food: 'You guys love food!',
      groceries: 'Grocery runs galore!',
      transport: 'Always on the move!',
      shopping: 'Shopaholics unite!',
      entertainment: 'Living the good life!',
      utilities: 'Keeping the lights on!',
      rent: 'Roof over your heads!',
      travel: 'Wanderlust is real!',
      health: 'Health is wealth!',
      coffee: 'Fueled by caffeine!',
      drinks: 'Cheers to that!',
      subscriptions: 'Subscribe to everything!',
      gifts: 'Generous bunch!',
      general: 'Keeping it general!',
      other: 'A bit of everything!',
    }

    // -- Biggest single expense
    const biggestExpense = [...allExpenses].sort((a, b) => b.amount - a.amount)[0]

    // -- Busiest Day
    const dayCountMap = new Map<string, number>()
    allExpenses.forEach((e) => {
      const dateStr = new Date(e.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      dayCountMap.set(dateStr, (dayCountMap.get(dateStr) || 0) + 1)
    })
    const busiestDay = [...dayCountMap.entries()].sort((a, b) => b[1] - a[1])[0]

    // -- Average expense
    const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0)
    const avgExpense = totalAmount / allExpenses.length

    // -- Quick stats
    const firstExpenseDate = new Date(
      [...allExpenses].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0].created_at
    )
    const daysSinceFirst = Math.max(
      1,
      Math.floor((Date.now() - firstExpenseDate.getTime()) / (1000 * 60 * 60 * 24))
    )

    // -- Most active day of week
    const dayOfWeekCount = [0, 0, 0, 0, 0, 0, 0]
    allExpenses.forEach((e) => {
      dayOfWeekCount[new Date(e.created_at).getDay()] += 1
    })
    const mostActiveDayIndex = dayOfWeekCount.indexOf(Math.max(...dayOfWeekCount))
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    // -- Expenses per week
    const weeksActive = Math.max(1, daysSinceFirst / 7)
    const expensesPerWeek = allExpenses.length / weeksActive

    // -- Fun fact: note stack height (1 INR 100 note is ~0.01 cm thick)
    const noteStackCm = (totalAmount / 100) * 0.01
    let stackDescription = ''
    if (noteStackCm < 1) {
      stackDescription = `${(noteStackCm * 10).toFixed(1)} mm`
    } else if (noteStackCm < 100) {
      stackDescription = `${noteStackCm.toFixed(1)} cm`
    } else {
      stackDescription = `${(noteStackCm / 100).toFixed(2)} m`
    }

    return {
      bigSpender: bigSpender ? { id: bigSpender[0], ...bigSpender[1] } : null,
      expenseKing: expenseKing ? { id: expenseKing[0], ...expenseKing[1] } : null,
      topCategory: topCategory ? { key: topCategory[0], count: topCategory[1], info: topCategoryInfo, tagline: categoryTaglines[topCategory[0]] || 'Interesting choice!' } : null,
      biggestExpense,
      busiestDay: busiestDay ? { date: busiestDay[0], count: busiestDay[1] } : null,
      avgExpense,
      totalAmount,
      totalCount: allExpenses.length,
      activeMembers: members.length,
      daysSinceFirst,
      mostActiveDay: dayNames[mostActiveDayIndex],
      expensesPerWeek,
      stackDescription,
      firstExpenseDate,
    }
  }, [allExpenses, members])

  // ---- Render ------------------------------------------------------------

  if (isLoading) {
    return <AnalyticsSkeleton />
  }

  if (!allExpenses.length) {
    return (
      <>
        <PageHeader />
        <EmptyState groupName={groupName} />
      </>
    )
  }

  if (!analytics) {
    return null
  }

  const CategoryIcon = analytics.topCategory?.info.icon || Target

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader />

      {/* ---- Quick Stats Row ---- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard>
          <div className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Total Expenses
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              <AnimatedNumber value={analytics.totalCount} />
            </p>
          </div>
        </StatCard>

        <StatCard>
          <div className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Total Amount
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              <AnimatedNumber value={analytics.totalAmount} prefix="₹" />
            </p>
          </div>
        </StatCard>

        <StatCard>
          <div className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Members
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              <AnimatedNumber value={analytics.activeMembers} />
            </p>
          </div>
        </StatCard>

        <StatCard>
          <div className="p-4 sm:p-5">
            <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Days Active
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              <AnimatedNumber value={analytics.daysSinceFirst} />
            </p>
          </div>
        </StatCard>
      </motion.div>

      {/* ---- Main Stats Grid ---- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
      >
        {/* Big Spender */}
        {analytics.bigSpender && (
          <StatCard>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl" aria-hidden="true">💸</span>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Big Spender
                </h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                {analytics.bigSpender.name}
              </p>
              <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                <AnimatedNumber value={analytics.bigSpender.total} prefix="₹" />
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                This person&apos;s wallet is on fire!
              </p>
            </div>
          </StatCard>
        )}

        {/* Expense King/Queen */}
        {analytics.expenseKing && (
          <StatCard>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl" aria-hidden="true">🏆</span>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Expense Royalty
                </h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                {analytics.expenseKing.name}
              </p>
              <p className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                <AnimatedNumber value={analytics.expenseKing.count} suffix=" expenses" />
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Transaction machine!
              </p>
            </div>
          </StatCard>
        )}

        {/* Category Champion */}
        {analytics.topCategory && (
          <StatCard>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl" aria-hidden="true">📊</span>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Category Champion
                </h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${analytics.topCategory.info.bgColor}`}>
                  <CategoryIcon className={`h-5 w-5 ${analytics.topCategory.info.textColor}`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {analytics.topCategory.info.label}
                  </p>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    <AnimatedNumber value={analytics.topCategory.count} suffix=" expenses" />
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {analytics.topCategory.tagline}
              </p>
            </div>
          </StatCard>
        )}

        {/* Biggest Single Expense */}
        {analytics.biggestExpense && (
          <StatCard>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl" aria-hidden="true">💰</span>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Biggest Expense
                </h3>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                <AnimatedNumber value={analytics.biggestExpense.amount} prefix="₹" />
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 truncate">
                {analytics.biggestExpense.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Paid by{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {analytics.biggestExpense.paid_by_user?.name || analytics.biggestExpense.paid_by_user?.email || 'someone'}
                </span>{' '}
                on{' '}
                {new Date(analytics.biggestExpense.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                That one time someone went all out!
              </p>
            </div>
          </StatCard>
        )}

        {/* Busiest Day */}
        {analytics.busiestDay && (
          <StatCard>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl" aria-hidden="true">📅</span>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Busiest Day
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                {analytics.busiestDay.date}
              </p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-3">
                <AnimatedNumber value={analytics.busiestDay.count} suffix=" expenses" />
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-blue-500" />
                {analytics.busiestDay.count} expense{analytics.busiestDay.count !== 1 ? 's' : ''} in ONE day? Legendary!
              </p>
            </div>
          </StatCard>
        )}

        {/* Average Expense */}
        <StatCard>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl" aria-hidden="true">🤑</span>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Average Expense
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1">
              <AnimatedNumber value={analytics.avgExpense} prefix="₹" />
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Not bad, not bad at all!
            </p>
          </div>
        </StatCard>
      </motion.div>

      {/* ---- Monthly Trend Chart ---- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
      >
        <StatCard colSpan="col-span-full">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl" aria-hidden="true">📈</span>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Monthly Trend
              </h3>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium">Last 6 months</span>
            </div>
            <MonthlyTrend expenses={allExpenses} />
          </div>
        </StatCard>
      </motion.div>

      {/* ---- Fun Facts Section ---- */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
      >
        <StatCard colSpan="col-span-full">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-5 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🎯</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Fun Facts
              </h3>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={cardVariants} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Note Stack Height</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    If you stacked ₹{analytics.totalAmount.toLocaleString('en-IN')} in ₹100 notes, it would be {analytics.stackDescription} tall
                  </p>
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <Target className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dedication Level</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You&apos;ve been splitting expenses for {analytics.daysSinceFirst} day{analytics.daysSinceFirst !== 1 ? 's' : ''} &mdash; that&apos;s dedication!
                  </p>
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Most Active Day</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your most active day is {analytics.mostActiveDay} &mdash;{' '}
                    {['Saturday', 'Sunday'].includes(analytics.mostActiveDay) ? 'weekend warriors!' : 'weekday hustlers!'}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={cardVariants} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Weekly Pace</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    The group averages {analytics.expensesPerWeek.toFixed(1)} expenses per week &mdash;{' '}
                    {analytics.expensesPerWeek >= 7 ? 'that\'s at least one a day!' : analytics.expensesPerWeek >= 3 ? 'quite the active bunch!' : 'keeping it chill!'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </StatCard>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page header component
// ---------------------------------------------------------------------------
function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tight"
            style={{ letterSpacing: '-0.03em' }}
          >
            Analytics
          </h1>
        </div>
      </div>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium mt-1 ml-[52px] sm:ml-[60px]">
        Fun insights and stats for your group
      </p>
    </motion.div>
  )
}
