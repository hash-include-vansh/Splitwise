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
    <div className="rounded-xl border border-gray-200/60 bg-white p-4 sm:p-6 shadow-elegant">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
        Invite Members
      </h3>
      {!inviteLink ? (
        <div>
          <button
            onClick={handleGenerateInvite}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl bg-black px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-elegant hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Generating...' : 'Generate Invite Link'}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-200">{error}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium"
            />
            <button
              onClick={handleCopyLink}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setInviteLink(null)}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Generate new link
          </button>
        </div>
      )}
    </div>
  )
}

