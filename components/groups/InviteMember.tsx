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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Members</h3>
      {!inviteLink ? (
        <div>
          <button
            onClick={handleGenerateInvite}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Invite Link'}
          </button>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setInviteLink(null)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Generate new link
          </button>
        </div>
      )}
    </div>
  )
}

