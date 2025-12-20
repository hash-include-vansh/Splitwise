import type { SimplifiedDebt, UserNetBalance } from '@/lib/types'

export function simplifyDebts(netBalances: UserNetBalance[]): SimplifiedDebt[] {
  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors = netBalances
    .filter((b) => b.net_balance > 0.01) // Small threshold to avoid floating point issues
    .sort((a, b) => b.net_balance - a.net_balance)

  const debtors = netBalances
    .filter((b) => b.net_balance < -0.01)
    .map((b) => ({ ...b, net_balance: Math.abs(b.net_balance) })) // Convert to positive for easier calculation
    .sort((a, b) => b.net_balance - a.net_balance)

  const transactions: SimplifiedDebt[] = []

  // Greedy matching: match largest debtors to largest creditors
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    if (creditor.net_balance <= 0.01) {
      creditorIndex++
      continue
    }

    if (debtor.net_balance <= 0.01) {
      debtorIndex++
      continue
    }

    const amount = Math.min(creditor.net_balance, debtor.net_balance)

    transactions.push({
      from_user_id: debtor.user_id,
      to_user_id: creditor.user_id,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
    })

    creditor.net_balance -= amount
    debtor.net_balance -= amount

    if (creditor.net_balance <= 0.01) {
      creditorIndex++
    }
    if (debtor.net_balance <= 0.01) {
      debtorIndex++
    }
  }

  return transactions
}

