'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  calculateRawBalances,
  calculateSimplifiedBalances,
  calculateNetBalances,
} from '@/lib/services/balances-client'
import { SimplifiedDebtToggle } from '@/components/balances/SimplifiedDebtToggle'
import { SimplifiedDebtView } from '@/components/balances/SimplifiedDebtView'
import { RawBalanceView } from '@/components/balances/RawBalanceView'
import { useAuth } from '@/hooks/useAuth'
import type { RawBalance, SimplifiedDebt, UserNetBalance } from '@/lib/types'
import Link from 'next/link'

export default function BalancesPage() {
  const params = useParams()
  const groupId = params.groupId as string
  const { user, loading: authLoading } = useAuth()
  const [simplified, setSimplified] = useState(false)
  const [rawBalances, setRawBalances] = useState<RawBalance[]>([])
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([])
  const [netBalances, setNetBalances] = useState<UserNetBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalances() {
      setLoading(true)
      setError(null)

      try {
        const [rawResult, simplifiedResult, netResult] = await Promise.all([
          calculateRawBalances(groupId),
          calculateSimplifiedBalances(groupId),
          calculateNetBalances(groupId),
        ])

        if (rawResult.error) {
          setError(rawResult.error.message)
          return
        }
        if (simplifiedResult.error) {
          setError(simplifiedResult.error.message)
          return
        }
        if (netResult.error) {
          setError(netResult.error.message)
          return
        }

        setRawBalances(rawResult.data || [])
        setSimplifiedDebts(simplifiedResult.data || [])
        setNetBalances(netResult.data || [])
      } catch (err) {
        setError('Failed to load balances')
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()

    // Refetch on window focus for real-time updates
    const handleFocus = () => {
      fetchBalances()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [groupId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800"></div>
            <p className="mt-4 text-sm text-gray-500">Loading balances...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Group
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-3 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Balances
        </h1>
      </div>

      <div className="mb-6">
        <SimplifiedDebtToggle simplified={simplified} onToggle={setSimplified} />
      </div>

      {simplified ? (
        <SimplifiedDebtView debts={simplifiedDebts} groupId={groupId} />
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Raw Balances</h2>
            <p className="mt-1 text-sm text-gray-600">
              Shows who owes whom based on all expenses
            </p>
          </div>
          <RawBalanceView balances={rawBalances} currentUserId={user?.id} groupId={groupId} />
        </div>
      )}
    </div>
  )
}

