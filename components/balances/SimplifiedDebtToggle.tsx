'use client'

interface SimplifiedDebtToggleProps {
  simplified: boolean
  onToggle: (simplified: boolean) => void
}

export function SimplifiedDebtToggle({ simplified, onToggle }: SimplifiedDebtToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200/60 bg-white p-1 shadow-elegant">
      <button
        onClick={() => onToggle(false)}
        className={`rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          !simplified
            ? 'bg-black text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        Raw Balances
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          simplified
            ? 'bg-black text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        Simplified
      </button>
    </div>
  )
}

