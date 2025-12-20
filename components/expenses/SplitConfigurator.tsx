import type { SplitType, GroupMember } from '@/lib/types'

interface SplitConfiguratorProps {
  splitType: SplitType
  amount: number
  members: GroupMember[]
  config: any
  onConfigChange: (config: any) => void
  excludedMembers: string[]
  onExcludedMembersChange: (members: string[]) => void
}

export function SplitConfigurator({
  splitType,
  amount,
  members,
  config,
  onConfigChange,
  excludedMembers,
  onExcludedMembersChange,
}: SplitConfiguratorProps) {
  const handleExcludeToggle = (userId: string) => {
    if (excludedMembers.includes(userId)) {
      onExcludedMembersChange(excludedMembers.filter((id) => id !== userId))
    } else {
      onExcludedMembersChange([...excludedMembers, userId])
    }
  }

  const handleAmountChange = (userId: string, value: string) => {
    if (splitType === 'unequal') {
      onConfigChange({
        ...config,
        amounts: { ...config.amounts, [userId]: value },
      })
    } else if (splitType === 'percentage') {
      onConfigChange({
        ...config,
        percentages: { ...config.percentages, [userId]: value },
      })
    } else if (splitType === 'shares') {
      onConfigChange({
        ...config,
        shares: { ...config.shares, [userId]: value },
      })
    }
  }

  const calculatePreview = (userId: string) => {
    if (splitType === 'equal') {
      return amount > 0 ? (amount / members.length).toFixed(2) : '0.00'
    } else if (splitType === 'unequal') {
      const val = config.amounts?.[userId]
      return val && !isNaN(parseFloat(val)) ? parseFloat(val).toFixed(2) : '0.00'
    } else if (splitType === 'percentage') {
      const val = config.percentages?.[userId]
      return val && !isNaN(parseFloat(val))
        ? ((amount * parseFloat(val)) / 100).toFixed(2)
        : '0.00'
    } else if (splitType === 'shares') {
      const shares = config.shares || {}
      const shareEntries = Object.entries(shares).filter(
        ([_, val]) => val !== '' && !isNaN(parseFloat(val as string))
      )
      const totalShares = shareEntries.reduce(
        (sum, [_, val]) => sum + parseFloat(val as string),
        0
      )
      const userShare = shares[userId]
      return userShare && totalShares > 0
        ? ((amount * parseFloat(userShare)) / totalShares).toFixed(2)
        : '0.00'
    }
    return '0.00'
  }

  const getTotal = () => {
    if (splitType === 'equal') {
      return amount.toFixed(2)
    } else if (splitType === 'unequal') {
      const total = Object.values(config.amounts || {})
        .filter((val) => val !== '' && !isNaN(parseFloat(val as string)))
        .reduce((sum: number, val) => sum + parseFloat(val as string), 0)
      return total.toFixed(2)
    } else if (splitType === 'percentage') {
      const total = Object.values(config.percentages || {})
        .filter((val) => val !== '' && !isNaN(parseFloat(val as string)))
        .reduce((sum: number, val) => sum + parseFloat(val as string), 0)
      return `${total.toFixed(1)}%`
    } else if (splitType === 'shares') {
      const total = Object.values(config.shares || {})
        .filter((val) => val !== '' && !isNaN(parseFloat(val as string)))
        .reduce((sum: number, val) => sum + parseFloat(val as string), 0)
      return total.toFixed(0)
    }
    return '0.00'
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Split Configuration
        </label>
        <div className="space-y-2">
          {members.map((member) => {
            const user = member.user
            const isExcluded = excludedMembers.includes(member.user_id)

            return (
              <div
                key={member.user_id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isExcluded ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-gray-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={() => handleExcludeToggle(member.user_id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {user?.name || user?.email || 'Unknown'}
                  </div>
                  {splitType === 'unequal' && (
                    <input
                      type="number"
                      value={config.amounts?.[member.user_id] || ''}
                      onChange={(e) => handleAmountChange(member.user_id, e.target.value)}
                      disabled={isExcluded}
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                      placeholder="0.00"
                    />
                  )}
                  {splitType === 'percentage' && (
                    <input
                      type="number"
                      value={config.percentages?.[member.user_id] || ''}
                      onChange={(e) => handleAmountChange(member.user_id, e.target.value)}
                      disabled={isExcluded}
                      min="0"
                      max="100"
                      step="0.1"
                      className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                      placeholder="0"
                    />
                  )}
                  {splitType === 'shares' && (
                    <input
                      type="number"
                      value={config.shares?.[member.user_id] || ''}
                      onChange={(e) => handleAmountChange(member.user_id, e.target.value)}
                      disabled={isExcluded}
                      min="0"
                      step="0.1"
                      className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                      placeholder="1"
                    />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{calculatePreview(member.user_id)}
                  </div>
                  {splitType === 'percentage' && (
                    <div className="text-xs text-gray-500">
                      {config.percentages?.[member.user_id] || '0'}%
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Total:</span>
          <span className="font-semibold text-gray-900">
            {splitType === 'percentage' || splitType === 'shares' ? getTotal() : `₹${getTotal()}`}
          </span>
        </div>
      </div>
    </div>
  )
}

