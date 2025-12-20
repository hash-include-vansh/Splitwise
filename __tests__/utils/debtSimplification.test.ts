import { simplifyDebts } from '@/lib/utils/debtSimplification'
import type { UserNetBalance } from '@/lib/types'

describe('debtSimplification', () => {
  it('should simplify simple debts', () => {
    const netBalances: UserNetBalance[] = [
      { user_id: 'user1', net_balance: 50 },
      { user_id: 'user2', net_balance: -50 },
    ]

    const result = simplifyDebts(netBalances)
    expect(result).toHaveLength(1)
    expect(result[0].from_user_id).toBe('user2')
    expect(result[0].to_user_id).toBe('user1')
    expect(result[0].amount).toBe(50)
  })

  it('should simplify complex debts', () => {
    const netBalances: UserNetBalance[] = [
      { user_id: 'user1', net_balance: 100 },
      { user_id: 'user2', net_balance: -60 },
      { user_id: 'user3', net_balance: -40 },
    ]

    const result = simplifyDebts(netBalances)
    expect(result).toHaveLength(2)
    
    const user2Debt = result.find((d) => d.from_user_id === 'user2')
    const user3Debt = result.find((d) => d.from_user_id === 'user3')
    
    expect(user2Debt?.amount).toBe(60)
    expect(user3Debt?.amount).toBe(40)
    expect(user2Debt?.to_user_id).toBe('user1')
    expect(user3Debt?.to_user_id).toBe('user1')
  })

  it('should handle zero balances', () => {
    const netBalances: UserNetBalance[] = [
      { user_id: 'user1', net_balance: 50 },
      { user_id: 'user2', net_balance: 0 },
      { user_id: 'user3', net_balance: -50 },
    ]

    const result = simplifyDebts(netBalances)
    expect(result).toHaveLength(1)
    expect(result[0].from_user_id).toBe('user3')
    expect(result[0].to_user_id).toBe('user1')
  })

  it('should handle multiple creditors and debtors', () => {
    const netBalances: UserNetBalance[] = [
      { user_id: 'user1', net_balance: 80 },
      { user_id: 'user2', net_balance: 20 },
      { user_id: 'user3', net_balance: -60 },
      { user_id: 'user4', net_balance: -40 },
    ]

    const result = simplifyDebts(netBalances)
    // Should minimize to 2 transactions
    expect(result.length).toBeLessThanOrEqual(3)
    
    const totalFrom = result.reduce((sum, d) => sum + d.amount, 0)
    expect(totalFrom).toBeCloseTo(100, 2)
  })
})

