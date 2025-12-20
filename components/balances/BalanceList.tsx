import { BalanceCard } from './BalanceCard'
import type { UserNetBalance } from '@/lib/types'

interface BalanceListProps {
  balances: UserNetBalance[]
}

export function BalanceList({ balances }: BalanceListProps) {
  if (balances.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">All settled up! No balances to display.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {balances.map((balance) => (
        <BalanceCard key={balance.user_id} balance={balance} />
      ))}
    </div>
  )
}

