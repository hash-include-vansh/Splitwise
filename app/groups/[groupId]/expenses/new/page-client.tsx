'use client'

import { useState } from 'react'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { VoiceExpenseButton } from '@/components/expenses/VoiceExpenseButton'
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal'
import type { GroupMember } from '@/lib/types'
import Link from 'next/link'

interface NewExpensePageClientProps {
  groupId: string
  members: GroupMember[]
  currentUserId: string
  groupName: string
}

export function NewExpensePageClient({
  groupId,
  members,
  currentUserId,
  groupName,
}: NewExpensePageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [parsedExpenseData, setParsedExpenseData] = useState<any>(null)

  const handleExpenseParsed = (data: any) => {
    setParsedExpenseData(data)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/expenses`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Expenses
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                Add New Expense
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Who's paying? Let's split it up!
              </p>
            </div>
            <VoiceExpenseButton
              members={members}
              currentUserId={currentUserId}
              groupId={groupId}
              groupName={groupName}
              onExpenseParsed={handleExpenseParsed}
            />
          </div>
        </div>
        <div className="max-w-2xl">
          <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 sm:p-8 shadow-xl">
            <ExpenseForm
              groupId={groupId}
              members={members}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setParsedExpenseData(null)
        }}
        groupId={groupId}
        members={members}
        currentUserId={currentUserId}
        initialData={parsedExpenseData}
      />
    </>
  )
}

