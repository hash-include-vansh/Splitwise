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
      <div className="grid grid-cols-2 gap-2">
        {splitTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              value === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm">{type.label}</div>
            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

