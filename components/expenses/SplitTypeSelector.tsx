import type { SplitType } from '@/lib/types'

interface SplitTypeSelectorProps {
  value: SplitType
  onChange: (type: SplitType) => void
}

const splitTypes: { value: SplitType; label: string; description: string }[] = [
  { value: 'equal', label: 'Equal', description: 'Split equally among all members' },
  {
    value: 'unequal',
    label: 'Unequal',
    description: 'Enter exact amounts for each member',
  },
  {
    value: 'percentage',
    label: 'Percentage',
    description: 'Split by percentage (must total 100%)',
  },
  {
    value: 'shares',
    label: 'Shares',
    description: 'Split by shares (e.g., 2:1:1)',
  },
]

export function SplitTypeSelector({ value, onChange }: SplitTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Split Type
      </label>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {splitTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`rounded-lg sm:rounded-xl border-2 p-2.5 sm:p-3 text-left transition-all ${
              value === type.value
                ? 'border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-800 shadow-md'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-500 dark:hover:border-gray-500 hover:shadow-sm'
            }`}
          >
            <div className={`font-semibold text-xs sm:text-sm ${value === type.value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100'}`}>
              {type.label}
            </div>
            <div className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${value === type.value ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              {type.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
