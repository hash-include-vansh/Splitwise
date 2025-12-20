'use client'

interface SimplifiedDebtToggleProps {
  simplified: boolean
  onToggle: (simplified: boolean) => void
}

export function SimplifiedDebtToggle({ simplified, onToggle }: SimplifiedDebtToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <span className="text-sm font-medium text-gray-700">View:</span>
      <button
        onClick={() => onToggle(false)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          !simplified
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Raw Balances
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          simplified
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Simplified
      </button>
    </div>
  )
}

