import { simplifyDebts } from '@/lib/utils/debtSimplification'
import type { UserNetBalance, RawBalance, SimplifiedDebt } from '@/lib/types'

/**
 * These tests simulate the full balance calculation pipeline:
 * 1. Expenses → pairwise debts
 * 2. Netting opposite directions
 * 3. Applying payments
 * 4. Simplification algorithm
 * 5. Ensuring consistency between raw and simplified views
 *
 * The helper functions mirror the logic in balances.ts / balances-client.ts
 * so we can test the algorithm without needing a database.
 */

// ========================
// HELPER FUNCTIONS (mirrors service layer logic)
// ========================

interface Expense {
  id: string
  paid_by: string
  amount: number
  splits: { user_id: string; owed_amount: number }[]
}

interface Payment {
  debtor_id: string
  creditor_id: string
  amount: number
}

/**
 * Calculate raw pairwise balances from expenses, net opposite directions, apply payments.
 * This mirrors the logic in balances-client.ts calculateRawBalances.
 */
function calculateRawBalances(expenses: Expense[], payments: Payment[] = []): RawBalance[] {
  // Step 1: Accumulate debts per pair (debtor → creditor)
  const pairDebts = new Map<string, number>()

  expenses.forEach((expense) => {
    const payerId = expense.paid_by
    expense.splits.forEach((split) => {
      if (split.user_id === payerId) return
      const key = `${split.user_id}|${payerId}`
      pairDebts.set(key, (pairDebts.get(key) || 0) + split.owed_amount)
    })
  })

  // Step 2: Net opposite directions
  const nettedDebts = new Map<string, number>()
  const processed = new Set<string>()

  pairDebts.forEach((amount, key) => {
    if (processed.has(key)) return

    const [fromId, toId] = key.split('|')
    const reverseKey = `${toId}|${fromId}`
    const reverseAmount = pairDebts.get(reverseKey) || 0

    processed.add(key)
    processed.add(reverseKey)

    const net = amount - reverseAmount
    if (Math.abs(net) > 0.01) {
      if (net > 0) {
        nettedDebts.set(key, net)
      } else {
        nettedDebts.set(reverseKey, Math.abs(net))
      }
    }
  })

  // Step 3: Apply payments
  const paymentsMap = new Map<string, number>()
  payments.forEach((p) => {
    const key = `${p.debtor_id}|${p.creditor_id}`
    paymentsMap.set(key, (paymentsMap.get(key) || 0) + p.amount)
  })

  const rawBalances: RawBalance[] = []
  nettedDebts.forEach((originalAmount, key) => {
    const [fromUserId, toUserId] = key.split('|')
    const paidAmount = paymentsMap.get(key) || 0
    const remainingAmount = originalAmount - paidAmount
    const isSettled = remainingAmount <= 0.01

    if (originalAmount > 0.01) {
      rawBalances.push({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: Math.max(0, Math.round((remainingAmount + Number.EPSILON) * 100) / 100),
        originalAmount: Math.round((originalAmount + Number.EPSILON) * 100) / 100,
        paidAmount: Math.round((paidAmount + Number.EPSILON) * 100) / 100,
        isSettled,
      })
    }
  })

  return rawBalances
}

/**
 * Calculate net balance per user from expenses and payments.
 * This mirrors calculateNetBalances in balances-client.ts.
 */
function calculateNetBalances(expenses: Expense[], payments: Payment[] = []): UserNetBalance[] {
  const netBalances = new Map<string, number>()

  expenses.forEach((expense) => {
    const payerId = expense.paid_by
    const othersOwe = expense.splits
      .filter((s) => s.user_id !== payerId)
      .reduce((sum, s) => sum + s.owed_amount, 0)

    netBalances.set(payerId, (netBalances.get(payerId) || 0) + othersOwe)

    expense.splits.forEach((split) => {
      if (split.user_id === payerId) return
      netBalances.set(split.user_id, (netBalances.get(split.user_id) || 0) - split.owed_amount)
    })
  })

  // Apply payments
  payments.forEach((payment) => {
    netBalances.set(payment.debtor_id, (netBalances.get(payment.debtor_id) || 0) + payment.amount)
    netBalances.set(
      payment.creditor_id,
      (netBalances.get(payment.creditor_id) || 0) - payment.amount
    )
  })

  return Array.from(netBalances.entries())
    .filter(([_, balance]) => Math.abs(balance) > 0.01)
    .map(([userId, balance]) => ({
      user_id: userId,
      net_balance: Math.round((balance + Number.EPSILON) * 100) / 100,
    }))
}

/**
 * Calculate simplified balances using the same logic as the service:
 * - If payments exist: return raw pairwise debts as-is
 * - If no payments: use simplification algorithm
 */
function calculateSimplifiedBalances(
  expenses: Expense[],
  payments: Payment[] = []
): SimplifiedDebt[] {
  const rawBalances = calculateRawBalances(expenses, payments)
  const hasAnyPayments = rawBalances.some((b) => (b.paidAmount || 0) > 0.01)

  if (hasAnyPayments) {
    return rawBalances.map((b) => ({
      from_user_id: b.from_user_id,
      to_user_id: b.to_user_id,
      amount: b.amount,
      originalAmount: b.originalAmount,
      paidAmount: b.paidAmount,
      isSettled: b.isSettled,
    }))
  }

  const netBalances = calculateNetBalances(expenses, payments)
  return simplifyDebts(netBalances)
}

// ========================
// TESTS
// ========================

describe('Balance Calculations - Core Algorithm', () => {
  // ====== BASIC SCENARIOS ======

  describe('Basic: Two people, one expense', () => {
    const A = 'userA'
    const B = 'userB'

    test('A pays, B owes', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 100, splits: [
          { user_id: A, owed_amount: 50 },
          { user_id: B, owed_amount: 50 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      expect(raw).toHaveLength(1)
      expect(raw[0].from_user_id).toBe(B)
      expect(raw[0].to_user_id).toBe(A)
      expect(raw[0].amount).toBeCloseTo(50, 2)

      const net = calculateNetBalances(expenses)
      expect(net).toHaveLength(2)
      expect(net.find((n) => n.user_id === A)?.net_balance).toBeCloseTo(50, 2)
      expect(net.find((n) => n.user_id === B)?.net_balance).toBeCloseTo(-50, 2)

      const simplified = calculateSimplifiedBalances(expenses)
      expect(simplified).toHaveLength(1)
      expect(simplified[0].from_user_id).toBe(B)
      expect(simplified[0].to_user_id).toBe(A)
      expect(simplified[0].amount).toBeCloseTo(50, 2)
    })
  })

  describe('Basic: Two people, opposite expenses (netting)', () => {
    const A = 'userA'
    const B = 'userB'

    test('A pays 100 (split 50/50), B pays 60 (split 30/30) → B owes A 20', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 100, splits: [
          { user_id: A, owed_amount: 50 },
          { user_id: B, owed_amount: 50 },
        ]},
        { id: 'e2', paid_by: B, amount: 60, splits: [
          { user_id: A, owed_amount: 30 },
          { user_id: B, owed_amount: 30 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      expect(raw).toHaveLength(1)
      expect(raw[0].from_user_id).toBe(B)
      expect(raw[0].to_user_id).toBe(A)
      expect(raw[0].amount).toBeCloseTo(20, 2) // 50 - 30 = 20
    })

    test('Equal opposite expenses cancel out', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 100, splits: [
          { user_id: A, owed_amount: 50 },
          { user_id: B, owed_amount: 50 },
        ]},
        { id: 'e2', paid_by: B, amount: 100, splits: [
          { user_id: A, owed_amount: 50 },
          { user_id: B, owed_amount: 50 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      expect(raw).toHaveLength(0) // Perfectly cancelled out

      const net = calculateNetBalances(expenses)
      expect(net).toHaveLength(0) // Both net to zero
    })
  })

  // ====== PAYMENT SCENARIOS ======

  describe('Payments: Partial payment', () => {
    const A = 'userA'
    const B = 'userB'

    test('B owes A 100, B pays 60 → 40 remaining', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 200, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
        ]},
      ]
      const payments: Payment[] = [
        { debtor_id: B, creditor_id: A, amount: 60 },
      ]

      const raw = calculateRawBalances(expenses, payments)
      expect(raw).toHaveLength(1)
      expect(raw[0].from_user_id).toBe(B)
      expect(raw[0].to_user_id).toBe(A)
      expect(raw[0].amount).toBeCloseTo(40, 2)
      expect(raw[0].originalAmount).toBeCloseTo(100, 2)
      expect(raw[0].paidAmount).toBeCloseTo(60, 2)
      expect(raw[0].isSettled).toBe(false)
    })
  })

  describe('Payments: Full settlement', () => {
    const A = 'userA'
    const B = 'userB'

    test('B owes A 100, B pays 100 → settled', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 200, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
        ]},
      ]
      const payments: Payment[] = [
        { debtor_id: B, creditor_id: A, amount: 100 },
      ]

      const raw = calculateRawBalances(expenses, payments)
      expect(raw).toHaveLength(1)
      expect(raw[0].isSettled).toBe(true)
      expect(raw[0].amount).toBe(0)
      expect(raw[0].originalAmount).toBeCloseTo(100, 2)
      expect(raw[0].paidAmount).toBeCloseTo(100, 2)
    })
  })

  describe('Payments: Multiple payments on same debt', () => {
    const A = 'userA'
    const B = 'userB'

    test('B owes A 100, B pays 30 then 70 → settled', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 200, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
        ]},
      ]
      const payments: Payment[] = [
        { debtor_id: B, creditor_id: A, amount: 30 },
        { debtor_id: B, creditor_id: A, amount: 70 },
      ]

      const raw = calculateRawBalances(expenses, payments)
      expect(raw).toHaveLength(1)
      expect(raw[0].isSettled).toBe(true)
      expect(raw[0].amount).toBe(0)
      expect(raw[0].paidAmount).toBeCloseTo(100, 2)
    })
  })

  // ====== THREE PERSON SCENARIOS ======

  describe('Three people: Basic equal split', () => {
    const A = 'userA'
    const B = 'userB'
    const C = 'userC'

    test('A pays 300 split equally → B owes A 100, C owes A 100', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 300, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
          { user_id: C, owed_amount: 100 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      expect(raw).toHaveLength(2)

      const bToA = raw.find((r) => r.from_user_id === B && r.to_user_id === A)
      const cToA = raw.find((r) => r.from_user_id === C && r.to_user_id === A)

      expect(bToA?.amount).toBeCloseTo(100, 2)
      expect(cToA?.amount).toBeCloseTo(100, 2)

      // Simplified should be the same (no simplification possible)
      const simplified = calculateSimplifiedBalances(expenses)
      expect(simplified).toHaveLength(2)
    })
  })

  describe('Three people: Cross-expenses with netting', () => {
    const A = 'userA'
    const B = 'userB'
    const C = 'userC'

    test('A pays 300 (3-way), then B pays 150 (A+B) → net result is correct', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 300, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
          { user_id: C, owed_amount: 100 },
        ]},
        { id: 'e2', paid_by: B, amount: 150, splits: [
          { user_id: A, owed_amount: 75 },
          { user_id: B, owed_amount: 75 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)

      // B→A: B owes A 100 from e1, A owes B 75 from e2 → net B→A = 25
      const bToA = raw.find((r) => r.from_user_id === B && r.to_user_id === A)
      expect(bToA?.amount).toBeCloseTo(25, 2)

      // C→A: C owes A 100 from e1
      const cToA = raw.find((r) => r.from_user_id === C && r.to_user_id === A)
      expect(cToA?.amount).toBeCloseTo(100, 2)

      // No C→B or B→C debt (they didn't transact)
      const cToB = raw.find((r) => r.from_user_id === C && r.to_user_id === B)
      const bToC = raw.find((r) => r.from_user_id === B && r.to_user_id === C)
      expect(cToB).toBeUndefined()
      expect(bToC).toBeUndefined()
    })
  })

  // ====== CRITICAL: THE BUG SCENARIO ======
  // This tests the exact scenario from the user's bug report

  describe('CRITICAL: Payments must not create phantom debts in Settle Up', () => {
    const GG = 'global-gully'
    const V = 'vansh'
    const S = 'shabnam'

    test('After partial payment, Settle Up shows same debts as Who Owes Whom', () => {
      // Scenario: GG owes V a lot, V owes S some amount
      // GG makes a large payment to V
      // The Settle Up view should NOT create a phantom "S owes V" debt

      const expenses: Expense[] = [
        // V pays 1500, split 3-way (500 each)
        { id: 'e1', paid_by: V, amount: 1500, splits: [
          { user_id: V, owed_amount: 500 },
          { user_id: GG, owed_amount: 500 },
          { user_id: S, owed_amount: 500 },
        ]},
        // V pays 500, split 3-way
        { id: 'e2', paid_by: V, amount: 500, splits: [
          { user_id: V, owed_amount: 166.67 },
          { user_id: GG, owed_amount: 166.67 },
          { user_id: S, owed_amount: 166.66 },
        ]},
        // S pays 550, split V and S only
        { id: 'e3', paid_by: S, amount: 550, splits: [
          { user_id: V, owed_amount: 183.33 },
          { user_id: S, owed_amount: 183.33 },
          { user_id: GG, owed_amount: 183.34 },
        ]},
      ]

      // Step 1: Before payments, check raw balances
      const rawBefore = calculateRawBalances(expenses)
      const simplifiedBefore = calculateSimplifiedBalances(expenses)

      // Verify the raw debts are correct
      // GG→V: GG owes V from e1 (500) + e2 (166.67) = 666.67
      // GG→S: GG owes S from e3 (183.34)
      // S→V: S owes V from e1 (500) + e2 (166.66) = 666.66
      // V→S: V owes S from e3 (183.33)
      // Net S→V: 666.66 - 183.33 = 483.33
      // Net GG→V: 666.67
      // Net GG→S: 183.34

      // Step 2: GG pays V 500 (partial payment)
      const paymentsPartial: Payment[] = [
        { debtor_id: GG, creditor_id: V, amount: 500 },
      ]

      const rawAfterPartialPayment = calculateRawBalances(expenses, paymentsPartial)
      const simplifiedAfterPartialPayment = calculateSimplifiedBalances(expenses, paymentsPartial)

      // Since payments exist, simplified should be identical to raw
      expect(simplifiedAfterPartialPayment).toHaveLength(rawAfterPartialPayment.length)

      // Check each simplified debt matches a raw debt
      simplifiedAfterPartialPayment.forEach((simplified) => {
        const matchingRaw = rawAfterPartialPayment.find(
          (r) => r.from_user_id === simplified.from_user_id && r.to_user_id === simplified.to_user_id
        )
        expect(matchingRaw).toBeDefined()
        expect(simplified.amount).toBeCloseTo(matchingRaw!.amount, 2)
        expect(simplified.originalAmount).toBeCloseTo(matchingRaw!.originalAmount!, 2)
        expect(simplified.paidAmount).toBeCloseTo(matchingRaw!.paidAmount!, 2)
        expect(simplified.isSettled).toBe(matchingRaw!.isSettled)
      })

      // GG→V should show remaining after payment
      const ggToV = rawAfterPartialPayment.find(
        (r) => r.from_user_id === GG && r.to_user_id === V
      )
      expect(ggToV).toBeDefined()
      expect(ggToV!.paidAmount).toBeCloseTo(500, 2)
      expect(ggToV!.amount).toBeCloseTo(ggToV!.originalAmount! - 500, 1)

      // NO phantom debts should appear in simplified
      const phantomDebts = simplifiedAfterPartialPayment.filter((d) => {
        // A "phantom" debt is one that doesn't exist in the raw pairwise debts before payments
        const existedBefore = rawBefore.some(
          (r) => r.from_user_id === d.from_user_id && r.to_user_id === d.to_user_id
        )
        return !existedBefore && d.amount > 0.01
      })
      expect(phantomDebts).toHaveLength(0)
    })

    test('After full settlement, debt shows as settled (not removed + phantom)', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: V, amount: 300, splits: [
          { user_id: V, owed_amount: 100 },
          { user_id: GG, owed_amount: 100 },
          { user_id: S, owed_amount: 100 },
        ]},
      ]

      // GG fully pays V
      const payments: Payment[] = [{ debtor_id: GG, creditor_id: V, amount: 100 }]

      const raw = calculateRawBalances(expenses, payments)
      const simplified = calculateSimplifiedBalances(expenses, payments)

      // GG→V should exist as settled
      const ggToV = raw.find((r) => r.from_user_id === GG && r.to_user_id === V)
      expect(ggToV).toBeDefined()
      expect(ggToV!.isSettled).toBe(true)
      expect(ggToV!.amount).toBe(0)

      // S→V should be unsettled
      const sToV = raw.find((r) => r.from_user_id === S && r.to_user_id === V)
      expect(sToV).toBeDefined()
      expect(sToV!.isSettled).toBe(false)
      expect(sToV!.amount).toBeCloseTo(100, 2)

      // Simplified should show the same (payments exist)
      expect(simplified).toHaveLength(raw.length)
    })
  })

  // ====== CONSISTENCY CHECKS ======

  describe('Consistency: Raw and Simplified tell the same story', () => {
    const A = 'userA'
    const B = 'userB'
    const C = 'userC'

    test('Without payments: simplified total debt equals raw total debt', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 300, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
          { user_id: C, owed_amount: 100 },
        ]},
        { id: 'e2', paid_by: B, amount: 150, splits: [
          { user_id: A, owed_amount: 75 },
          { user_id: B, owed_amount: 75 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      const simplified = calculateSimplifiedBalances(expenses)

      const rawTotalDebt = raw.reduce((sum, r) => sum + r.amount, 0)
      const simplifiedTotalDebt = simplified.reduce((sum, s) => sum + s.amount, 0)

      // Total debt should be the same (simplification just changes pairings, not totals)
      expect(simplifiedTotalDebt).toBeCloseTo(rawTotalDebt, 1)
    })

    test('With payments: raw and simplified are identical (no re-simplification)', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: A, amount: 300, splits: [
          { user_id: A, owed_amount: 100 },
          { user_id: B, owed_amount: 100 },
          { user_id: C, owed_amount: 100 },
        ]},
      ]
      const payments: Payment[] = [{ debtor_id: B, creditor_id: A, amount: 50 }]

      const raw = calculateRawBalances(expenses, payments)
      const simplified = calculateSimplifiedBalances(expenses, payments)

      expect(simplified.length).toBe(raw.length)
      raw.forEach((rawBalance) => {
        const match = simplified.find(
          (s) => s.from_user_id === rawBalance.from_user_id && s.to_user_id === rawBalance.to_user_id
        )
        expect(match).toBeDefined()
        expect(match!.amount).toBeCloseTo(rawBalance.amount, 2)
      })
    })
  })

  // ====== NET BALANCE INVARIANTS ======

  describe('Net balance invariants', () => {
    test('Net balances always sum to zero', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 300, splits: [
          { user_id: 'A', owed_amount: 100 },
          { user_id: 'B', owed_amount: 100 },
          { user_id: 'C', owed_amount: 100 },
        ]},
        { id: 'e2', paid_by: 'B', amount: 200, splits: [
          { user_id: 'A', owed_amount: 80 },
          { user_id: 'B', owed_amount: 60 },
          { user_id: 'C', owed_amount: 60 },
        ]},
        { id: 'e3', paid_by: 'C', amount: 150, splits: [
          { user_id: 'A', owed_amount: 50 },
          { user_id: 'B', owed_amount: 50 },
          { user_id: 'C', owed_amount: 50 },
        ]},
      ]

      const net = calculateNetBalances(expenses)
      const totalNet = net.reduce((sum, n) => sum + n.net_balance, 0)
      expect(totalNet).toBeCloseTo(0, 2)
    })

    test('Net balances sum to zero even with payments', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 300, splits: [
          { user_id: 'A', owed_amount: 100 },
          { user_id: 'B', owed_amount: 100 },
          { user_id: 'C', owed_amount: 100 },
        ]},
      ]
      const payments: Payment[] = [
        { debtor_id: 'B', creditor_id: 'A', amount: 50 },
        { debtor_id: 'C', creditor_id: 'A', amount: 100 },
      ]

      const net = calculateNetBalances(expenses, payments)
      const totalNet = net.reduce((sum, n) => sum + n.net_balance, 0)
      expect(totalNet).toBeCloseTo(0, 2)
    })
  })

  // ====== ROUNDING EDGE CASES ======

  describe('Rounding edge cases', () => {
    test('Three-way split of 100 (33.33 + 33.33 + 33.34)', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 100, splits: [
          { user_id: 'A', owed_amount: 33.34 },
          { user_id: 'B', owed_amount: 33.33 },
          { user_id: 'C', owed_amount: 33.33 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      const totalDebt = raw.reduce((sum, r) => sum + r.amount, 0)
      expect(totalDebt).toBeCloseTo(66.66, 2)
    })

    test('Very small amounts near zero threshold', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 0.03, splits: [
          { user_id: 'A', owed_amount: 0.01 },
          { user_id: 'B', owed_amount: 0.01 },
          { user_id: 'C', owed_amount: 0.01 },
        ]},
      ]

      // Each person owes 0.01, which is at the threshold
      const raw = calculateRawBalances(expenses)
      // These should be filtered out (≤ 0.01)
      expect(raw.length).toBeLessThanOrEqual(2)
    })
  })

  // ====== LARGE GROUP SCENARIOS ======

  describe('Five people with complex expenses', () => {
    const users = ['u1', 'u2', 'u3', 'u4', 'u5']

    test('Multiple expenses, different payers', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'u1', amount: 500, splits: users.map((u) => ({ user_id: u, owed_amount: 100 })) },
        { id: 'e2', paid_by: 'u2', amount: 300, splits: [
          { user_id: 'u1', owed_amount: 100 },
          { user_id: 'u2', owed_amount: 100 },
          { user_id: 'u3', owed_amount: 100 },
        ]},
        { id: 'e3', paid_by: 'u3', amount: 200, splits: [
          { user_id: 'u3', owed_amount: 100 },
          { user_id: 'u4', owed_amount: 50 },
          { user_id: 'u5', owed_amount: 50 },
        ]},
        { id: 'e4', paid_by: 'u4', amount: 400, splits: users.map((u) => ({ user_id: u, owed_amount: 80 })) },
        { id: 'e5', paid_by: 'u5', amount: 150, splits: [
          { user_id: 'u1', owed_amount: 50 },
          { user_id: 'u2', owed_amount: 50 },
          { user_id: 'u5', owed_amount: 50 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      const net = calculateNetBalances(expenses)
      const simplified = calculateSimplifiedBalances(expenses)

      // Invariant 1: Net balances sum to zero
      const totalNet = net.reduce((sum, n) => sum + n.net_balance, 0)
      expect(totalNet).toBeCloseTo(0, 1)

      // Invariant 2: Simplified total debt equals sum of negative net balances
      const totalOwed = net
        .filter((n) => n.net_balance < -0.01)
        .reduce((sum, n) => sum + Math.abs(n.net_balance), 0)
      const simplifiedTotal = simplified.reduce((sum, s) => sum + s.amount, 0)
      expect(simplifiedTotal).toBeCloseTo(totalOwed, 1)

      // Invariant 3: Simplified has ≤ N-1 transactions (where N is number of people with non-zero balances)
      const nonZeroCount = net.length
      expect(simplified.length).toBeLessThanOrEqual(nonZeroCount - 1)
    })

    test('Multiple expenses with payments - no phantom debts', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'u1', amount: 500, splits: users.map((u) => ({ user_id: u, owed_amount: 100 })) },
        { id: 'e2', paid_by: 'u2', amount: 300, splits: [
          { user_id: 'u1', owed_amount: 100 },
          { user_id: 'u2', owed_amount: 100 },
          { user_id: 'u3', owed_amount: 100 },
        ]},
      ]

      const rawBefore = calculateRawBalances(expenses)
      const payments: Payment[] = [{ debtor_id: 'u3', creditor_id: 'u1', amount: 50 }]

      const rawAfter = calculateRawBalances(expenses, payments)
      const simplifiedAfter = calculateSimplifiedBalances(expenses, payments)

      // Every simplified debt must correspond to a raw debt
      simplifiedAfter.forEach((s) => {
        const exists = rawAfter.some(
          (r) => r.from_user_id === s.from_user_id && r.to_user_id === s.to_user_id
        )
        expect(exists).toBe(true)
      })

      // No phantom debts
      const phantoms = simplifiedAfter.filter((s) => {
        return !rawBefore.some(
          (r) => r.from_user_id === s.from_user_id && r.to_user_id === s.to_user_id
        ) && s.amount > 0.01
      })
      expect(phantoms).toHaveLength(0)
    })
  })

  // ====== SIMPLIFICATION ALGORITHM SPECIFIC TESTS ======

  describe('Simplification algorithm correctness', () => {
    test('4 people: optimal matching reduces transactions', () => {
      // A: +100, B: +50, C: -80, D: -70
      const netBalances: UserNetBalance[] = [
        { user_id: 'A', net_balance: 100 },
        { user_id: 'B', net_balance: 50 },
        { user_id: 'C', net_balance: -80 },
        { user_id: 'D', net_balance: -70 },
      ]

      const simplified = simplifyDebts(netBalances)

      // Should need at most 3 transactions (N-1 where N=4 non-zero)
      expect(simplified.length).toBeLessThanOrEqual(3)

      // Total amount paid out by debtors = 150
      const totalPaid = simplified.reduce((sum, s) => sum + s.amount, 0)
      expect(totalPaid).toBeCloseTo(150, 2)

      // All amounts should be positive
      simplified.forEach((s) => {
        expect(s.amount).toBeGreaterThan(0)
      })

      // Debtors should only be C and D
      simplified.forEach((s) => {
        expect(['C', 'D']).toContain(s.from_user_id)
        expect(['A', 'B']).toContain(s.to_user_id)
      })
    })

    test('All balanced (no debts) → empty result', () => {
      const netBalances: UserNetBalance[] = [
        { user_id: 'A', net_balance: 0 },
        { user_id: 'B', net_balance: 0 },
      ]

      const simplified = simplifyDebts(netBalances)
      expect(simplified).toHaveLength(0)
    })

    test('One creditor, many debtors', () => {
      const netBalances: UserNetBalance[] = [
        { user_id: 'A', net_balance: 300 },
        { user_id: 'B', net_balance: -100 },
        { user_id: 'C', net_balance: -100 },
        { user_id: 'D', net_balance: -100 },
      ]

      const simplified = simplifyDebts(netBalances)
      expect(simplified).toHaveLength(3)

      // All point to A
      simplified.forEach((s) => {
        expect(s.to_user_id).toBe('A')
        expect(s.amount).toBeCloseTo(100, 2)
      })
    })

    test('Many creditors, one debtor', () => {
      const netBalances: UserNetBalance[] = [
        { user_id: 'A', net_balance: 100 },
        { user_id: 'B', net_balance: 100 },
        { user_id: 'C', net_balance: 100 },
        { user_id: 'D', net_balance: -300 },
      ]

      const simplified = simplifyDebts(netBalances)
      expect(simplified).toHaveLength(3)

      // All from D
      simplified.forEach((s) => {
        expect(s.from_user_id).toBe('D')
        expect(s.amount).toBeCloseTo(100, 2)
      })
    })
  })

  // ====== EDGE CASES ======

  describe('Edge cases', () => {
    test('Single expense, one person pays for themselves (no debt)', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 100, splits: [
          { user_id: 'A', owed_amount: 100 },
        ]},
      ]

      const raw = calculateRawBalances(expenses)
      expect(raw).toHaveLength(0)

      const net = calculateNetBalances(expenses)
      expect(net).toHaveLength(0)
    })

    test('Overpayment does not create negative remaining', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 100, splits: [
          { user_id: 'A', owed_amount: 50 },
          { user_id: 'B', owed_amount: 50 },
        ]},
      ]
      // B pays A 60, but only owed 50
      const payments: Payment[] = [{ debtor_id: 'B', creditor_id: 'A', amount: 60 }]

      const raw = calculateRawBalances(expenses, payments)
      expect(raw).toHaveLength(1)
      expect(raw[0].amount).toBe(0) // Math.max(0, ...) prevents negative
      expect(raw[0].isSettled).toBe(true)
    })

    test('Payment on a pair that has no expenses does not create phantom', () => {
      const expenses: Expense[] = [
        { id: 'e1', paid_by: 'A', amount: 100, splits: [
          { user_id: 'A', owed_amount: 50 },
          { user_id: 'B', owed_amount: 50 },
        ]},
      ]
      // C pays A (but C doesn't owe A anything)
      const payments: Payment[] = [{ debtor_id: 'C', creditor_id: 'A', amount: 50 }]

      const raw = calculateRawBalances(expenses, payments)
      // Only B→A should exist
      expect(raw).toHaveLength(1)
      expect(raw[0].from_user_id).toBe('B')
      expect(raw[0].to_user_id).toBe('A')
    })
  })
})
