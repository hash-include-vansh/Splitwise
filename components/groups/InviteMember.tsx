'use client'

import { useState } from 'react'
import { inviteMember } from '@/lib/services/groups-client'

interface InviteMemberProps {
  groupId: string
}

export function InviteMember({ groupId }: InviteMemberProps) {
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateInvite = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: inviteError } = await inviteMember(groupId, 7)
      if (inviteError || !data) {
        setError(inviteError?.message || 'Failed to generate invite')
        return
      }

      const link = `${window.location.origin}/invite/${data.invite_token}`
      setInviteLink(link)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-elegant flex flex-col items-center justify-center">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
        Invite Members
      </h3>
      {!inviteLink ? (
        <div className="flex flex-col items-center">
          <button
            onClick={handleGenerateInvite}
            disabled={loading}
            className="rounded-xl bg-black dark:bg-white px-5 py-3 text-sm sm:text-base font-semibold text-white dark:text-gray-900 shadow-elegant dark:shadow-none hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Generating...' : 'Generate Invite Link'}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 border border-red-200 dark:border-red-800">{error}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium"
            />
            <button
              onClick={handleCopyLink}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-95"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setInviteLink(null)}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Generate new link
          </button>
        </div>
      )}
    </div>
  )
}

