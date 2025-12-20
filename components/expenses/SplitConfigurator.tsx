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
    const isExcluded = excludedMembers.includes(userId)
    if (isExcluded) return '0.00'
    
    if (splitType === 'equal') {
      const availableCount = members.filter(m => !excludedMembers.includes(m.user_id)).length
      return amount > 0 && availableCount > 0 ? (amount / availableCount).toFixed(2) : '0.00'
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
      // Only count non-excluded members' shares
      const shareEntries = Object.entries(shares).filter(
        ([id, val]) => !excludedMembers.includes(id) && val !== '' && !isNaN(parseFloat(val as string))
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
      const total = Object.entries(config.amounts || {})
        .filter(([userId, val]) => !excludedMembers.includes(userId) && val !== '' && !isNaN(parseFloat(val as string)))
        .reduce((sum: number, [_, val]) => sum + parseFloat(val as string), 0)
      return total.toFixed(2)
    } else if (splitType === 'percentage') {
      const total = Object.entries(config.percentages || {})
        .filter(([userId, val]) => !excludedMembers.includes(userId) && val !== '' && !isNaN(parseFloat(val as string)))
        .reduce((sum: number, [_, val]) => sum + parseFloat(val as string), 0)
      return `${total.toFixed(1)}%`
    } else if (splitType === 'shares') {
      const total = Object.entries(config.shares || {})
        .filter(([userId, val]) => !excludedMembers.includes(userId) && val !== '' && !isNaN(parseFloat(val as string)))
        .reduce((sum: number, [_, val]) => sum + parseFloat(val as string), 0)
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
                className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                  isExcluded 
                    ? 'border-gray-300/60 bg-gradient-to-br from-gray-100 to-gray-200/50 opacity-60' 
                    : 'border-gray-300 bg-white shadow-medium hover:shadow-large hover:border-gray-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  onChange={() => handleExcludeToggle(member.user_id)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className={`font-medium text-sm ${isExcluded ? 'text-gray-400' : 'text-gray-900'}`}>
                    {user?.name || user?.email || 'Unknown'}
                    {isExcluded && ' (excluded)'}
                  </div>
                  {splitType === 'unequal' && (
                    <input
                      type="number"
                      value={config.amounts?.[member.user_id] || ''}
                      onChange={(e) => handleAmountChange(member.user_id, e.target.value)}
                      disabled={isExcluded}
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                      placeholder="Enter amount"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                      placeholder="Enter %"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
                      placeholder="Enter shares"
                    />
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${isExcluded ? 'text-gray-400' : 'text-gray-900'}`}>
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

          <div className="rounded-xl bg-gray-100 border-2 border-gray-400 p-4 shadow-md">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-700">Total:</span>
          <span className="font-bold text-gray-900 text-lg">
            {splitType === 'percentage' || splitType === 'shares' ? getTotal() : `₹${getTotal()}`}
          </span>
        </div>
      </div>
    </div>
  )
}

