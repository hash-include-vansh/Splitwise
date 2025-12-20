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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Split Type
      </label>
      <div className="grid grid-cols-2 gap-3">
        {splitTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              value === type.value
                ? 'border-gray-900 bg-gray-100 shadow-md'
                : 'border-gray-300 bg-white hover:border-gray-500 hover:shadow-sm'
            }`}
          >
            <div className={`font-semibold text-sm ${value === type.value ? 'text-gray-900' : 'text-gray-900'}`}>
              {type.label}
            </div>
            <div className={`text-xs mt-1 ${value === type.value ? 'text-gray-700' : 'text-gray-500'}`}>
              {type.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

