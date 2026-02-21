'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SeedResult {
  success: boolean
  message: string
  groups?: { id: string; name: string; expenses: number }[]
  demoUsers?: number
  error?: string
}

export default function SeedDemoData() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)

  async function handleSeed() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data: SeedResult = await res.json()
      setResult(data)
      if (data.success) {
        // Refresh the page data and redirect to groups after a moment
        setTimeout(() => router.push('/groups'), 2000)
      }
    } catch {
      setResult({ success: false, message: '', error: 'Network error — could not reach /api/seed' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setResult(null)
    try {
      const res = await fetch('/api/seed', { method: 'DELETE' })
      const data: SeedResult = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, message: '', error: 'Network error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-sm text-white">
          ✦
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
            Seed Demo Groups
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
            Creates three realistic demo groups with 38 total expenses to explore the app:
          </p>

          <div className="space-y-2 mb-4">
            {[
              { emoji: '🏖️', name: 'Goa Trip 2025',          desc: '5 people · 14 expenses · ₹1,01,500 · mixed split types' },
              { emoji: '🎂', name: "Raghav's Birthday Bash",  desc: '6 people · 9 expenses · ₹49,500 · birthday boy pays nothing' },
              { emoji: '🏠', name: 'Bangalore Flatmates',     desc: '4 people · 15 expenses · ₹1,38,000 · 2 months of rent & bills' },
            ].map(g => (
              <div key={g.name} className="flex items-start gap-2 text-sm">
                <span className="text-lg leading-none">{g.emoji}</span>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{g.name}</span>
                  <span className="text-gray-500 dark:text-gray-400"> — {g.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSeed}
              disabled={loading || deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Seeding… this may take 15–30s
                </>
              ) : (
                'Seed Demo Data'
              )}
            </button>

            <button
              onClick={handleDelete}
              disabled={loading || deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
            >
              {deleting ? 'Removing…' : 'Remove Demo Data'}
            </button>
          </div>

          {result && (
            <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
              result.success
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              {result.success ? (
                <div>
                  <p className="font-semibold">{result.message}</p>
                  {result.groups && (
                    <ul className="mt-1 space-y-0.5">
                      {result.groups.map(g => (
                        <li key={g.id}>
                          {g.name} — {g.expenses} expenses
                        </li>
                      ))}
                    </ul>
                  )}
                  {result.demoUsers !== undefined && (
                    <p className="mt-1 text-xs opacity-75">{result.demoUsers} demo user accounts created. Redirecting to groups…</p>
                  )}
                </div>
              ) : (
                <p>{result.error || result.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
