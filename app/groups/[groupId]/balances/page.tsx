'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  calculateRawBalances,
  calculateSimplifiedBalances,
  calculateNetBalances,
} from '@/lib/services/balances-client'
import { BalanceList } from '@/components/balances/BalanceList'
import { SimplifiedDebtToggle } from '@/components/balances/SimplifiedDebtToggle'
import { SimplifiedDebtView } from '@/components/balances/SimplifiedDebtView'
import type { RawBalance, SimplifiedDebt, UserNetBalance } from '@/lib/types'
import Link from 'next/link'

export default function BalancesPage() {
  const params = useParams()
  const groupId = params.groupId as string
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
  }, [groupId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading balances...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${groupId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Group
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Balances</h1>
      </div>

      <div className="mb-6">
        <SimplifiedDebtToggle simplified={simplified} onToggle={setSimplified} />
      </div>

      {simplified ? (
        <SimplifiedDebtView debts={simplifiedDebts} />
      ) : (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Net Balances</h2>
          <BalanceList balances={netBalances} />
        </div>
      )}
    </div>
  )
}

