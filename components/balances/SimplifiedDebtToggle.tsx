'use client'

interface SimplifiedDebtToggleProps {
  simplified: boolean
  onToggle: (simplified: boolean) => void
}

export function SimplifiedDebtToggle({ simplified, onToggle }: SimplifiedDebtToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-1 shadow-elegant dark:shadow-none">
      <button
        onClick={() => onToggle(false)}
        className={`rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          !simplified
            ? 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        Who Owes Whom
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          simplified
            ? 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        Settle Up
      </button>
    </div>
  )
}

