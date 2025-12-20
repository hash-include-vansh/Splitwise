import { calculateEqualSplit, calculateUnequalSplit, calculatePercentageSplit, calculateShareSplit, validateSplits } from '@/lib/utils/splitCalculations'
import { simplifyDebts } from '@/lib/utils/debtSimplification'
import type { ExpenseSplit, UserNetBalance } from '@/lib/types'

describe('Edge Case Test Scenarios', () => {
  // Test Case 1: Mixed Split Types with Partial Exclusions
  describe('Test Case 1: Mixed Split Types with Partial Exclusions', () => {
    const vanshId = 'user-vansh'
    const shabnamId = 'user-shabnam'
    const globalGullyId = 'user-global-gully'

    test('Expense 1: Restaurant Bill (Equal Split)', () => {
      const amount = 300.00
      const splits = calculateEqualSplit(amount, [vanshId, shabnamId, globalGullyId])
      
      expect(splits).toHaveLength(3)
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(100.00, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(100.00, 2)
      expect(splits.find(s => s.user_id === globalGullyId)?.owed_amount).toBeCloseTo(100.00, 2)
    })

    test('Expense 2: Movie Tickets (Unequal Split)', () => {
      const amount = 450.00
      const amounts = {
        [vanshId]: 200,
        [shabnamId]: 150,
        [globalGullyId]: 100,
      }
      const splits = calculateUnequalSplit(amount, amounts)
      
      expect(splits).toHaveLength(3)
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(200.00, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(150.00, 2)
      expect(splits.find(s => s.user_id === globalGullyId)?.owed_amount).toBeCloseTo(100.00, 2)
    })

    test('Expense 3: Groceries (Percentage Split)', () => {
      const amount = 600.00
      const percentages = {
        [vanshId]: 50,
        [shabnamId]: 30,
        [globalGullyId]: 20,
      }
      const splits = calculatePercentageSplit(amount, percentages)
      
      expect(splits).toHaveLength(3)
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(300.00, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(180.00, 2)
      expect(splits.find(s => s.user_id === globalGullyId)?.owed_amount).toBeCloseTo(120.00, 2)
    })

    test('Expense 4: Taxi Ride (Shares Split with Exclusion)', () => {
      const amount = 150.00
      const shares = {
        [vanshId]: 2,
        [shabnamId]: 1,
        // Global Gully excluded
      }
      const splits = calculateShareSplit(amount, shares)
      
      expect(splits).toHaveLength(2)
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(100.00, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(50.00, 2)
    })

    test('Final Net Balances for Test Case 1', () => {
      // Expense 1: Vansh paid 300, all owe 100 each
      // Expense 2: Shabnam paid 450, Vansh owes 200, Shabnam owes 150, Global Gully owes 100
      // Expense 3: Global Gully paid 600, Vansh owes 300, Shabnam owes 180, Global Gully owes 120
      // Expense 4: Vansh paid 150, Vansh owes 100, Shabnam owes 50

      const netBalances: UserNetBalance[] = [
        {
          user_id: vanshId,
          net_balance: 300 - 100 - 200 - 300 + 150 - 100, // -250
        },
        {
          user_id: shabnamId,
          net_balance: -100 + 450 - 150 - 180 - 50, // -30
        },
        {
          user_id: globalGullyId,
          net_balance: -100 - 100 + 600 - 120, // +280
        },
      ]

      expect(netBalances.find(b => b.user_id === vanshId)?.net_balance).toBeCloseTo(-250.00, 2)
      expect(netBalances.find(b => b.user_id === shabnamId)?.net_balance).toBeCloseTo(-30.00, 2)
      expect(netBalances.find(b => b.user_id === globalGullyId)?.net_balance).toBeCloseTo(280.00, 2)

      const simplified = simplifyDebts(netBalances)
      expect(simplified).toHaveLength(2)
      // Shabnam owes Global Gully 30
      expect(simplified.find(d => d.from_user_id === shabnamId && d.to_user_id === globalGullyId)?.amount).toBeCloseTo(30.00, 2)
      // Vansh owes Global Gully 250
      expect(simplified.find(d => d.from_user_id === vanshId && d.to_user_id === globalGullyId)?.amount).toBeCloseTo(250.00, 2)
    })
  })

  // Test Case 2: Circular Debt Chain
  describe('Test Case 2: Circular Debt Chain', () => {
    const vanshId = 'user-vansh'
    const shabnamId = 'user-shabnam'
    const globalGullyId = 'user-global-gully'

    test('All expenses are equal splits', () => {
      // Expense 1: Vansh paid 900, all owe 300
      const splits1 = calculateEqualSplit(900, [vanshId, shabnamId, globalGullyId])
      expect(splits1.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(900, 2)

      // Expense 2: Shabnam paid 1200, all owe 400
      const splits2 = calculateEqualSplit(1200, [vanshId, shabnamId, globalGullyId])
      expect(splits2.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(1200, 2)

      // Expense 3: Global Gully paid 1500, all owe 500
      const splits3 = calculateEqualSplit(1500, [vanshId, shabnamId, globalGullyId])
      expect(splits3.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(1500, 2)
    })

    test('Final Net Balances for Test Case 2', () => {
      const netBalances: UserNetBalance[] = [
        {
          user_id: vanshId,
          net_balance: 900 - 300 - 400 - 500, // -300
        },
        {
          user_id: shabnamId,
          net_balance: -300 + 1200 - 400 - 500, // 0
        },
        {
          user_id: globalGullyId,
          net_balance: -300 - 400 + 1500 - 500, // +300
        },
      ]

      expect(netBalances.find(b => b.user_id === vanshId)?.net_balance).toBeCloseTo(-300.00, 2)
      expect(netBalances.find(b => b.user_id === shabnamId)?.net_balance).toBeCloseTo(0.00, 2)
      expect(netBalances.find(b => b.user_id === globalGullyId)?.net_balance).toBeCloseTo(300.00, 2)

      const simplified = simplifyDebts(netBalances)
      expect(simplified).toHaveLength(1)
      // Vansh owes Global Gully 300
      expect(simplified[0].from_user_id).toBe(vanshId)
      expect(simplified[0].to_user_id).toBe(globalGullyId)
      expect(simplified[0].amount).toBeCloseTo(300.00, 2)
    })
  })

  // Test Case 3: Complex Multi-Type with Rounding Edge Cases
  describe('Test Case 3: Complex Multi-Type with Rounding Edge Cases', () => {
    const vanshId = 'user-vansh'
    const shabnamId = 'user-shabnam'
    const globalGullyId = 'user-global-gully'

    test('Expense 1: Coffee Shop (Equal Split with rounding)', () => {
      const amount = 100.00
      const splits = calculateEqualSplit(amount, [vanshId, shabnamId, globalGullyId])
      
      const total = splits.reduce((sum, s) => sum + s.owed_amount, 0)
      expect(total).toBeCloseTo(amount, 2)
      // Should handle rounding: 33.33, 33.33, 33.34
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(100.00, 2)
    })

    test('Expense 2: Lunch (Percentage Split)', () => {
      const amount = 333.33
      const percentages = {
        [vanshId]: 40,
        [shabnamId]: 35,
        [globalGullyId]: 25,
      }
      const splits = calculatePercentageSplit(amount, percentages)
      
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(133.33, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(116.67, 2)
      expect(splits.find(s => s.user_id === globalGullyId)?.owed_amount).toBeCloseTo(83.33, 2)
    })

    test('Expense 3: Shopping (Shares Split)', () => {
      const amount = 250.00
      const shares = {
        [vanshId]: 3,
        [shabnamId]: 2,
        [globalGullyId]: 1,
      }
      const splits = calculateShareSplit(amount, shares)
      
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(125.00, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(83.33, 2)
      expect(splits.find(s => s.user_id === globalGullyId)?.owed_amount).toBeCloseTo(41.67, 2)
    })

    test('Expense 4: Uber (Unequal Split with Exclusion)', () => {
      const amount = 75.00
      const amounts = {
        [vanshId]: 25,
        [shabnamId]: 50,
        // Global Gully excluded
      }
      const splits = calculateUnequalSplit(amount, amounts)
      
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
      expect(splits.find(s => s.user_id === vanshId)?.owed_amount).toBeCloseTo(25.00, 2)
      expect(splits.find(s => s.user_id === shabnamId)?.owed_amount).toBeCloseTo(50.00, 2)
    })

    test('Expense 5: Dinner (Equal Split with rounding)', () => {
      const amount = 200.00
      const splits = calculateEqualSplit(amount, [vanshId, shabnamId, globalGullyId])
      
      expect(splits.reduce((sum, s) => sum + s.owed_amount, 0)).toBeCloseTo(amount, 2)
    })

    test('Final Net Balances for Test Case 3', () => {
      // Expense 1: Vansh paid 100, all owe 33.33 (100/3)
      // Expense 2: Shabnam paid 333.33, Vansh owes 133.33, Shabnam owes 116.67, Global Gully owes 83.33
      // Expense 3: Global Gully paid 250, Vansh owes 125, Shabnam owes 83.33, Global Gully owes 41.67
      // Expense 4: Vansh paid 75, Vansh owes 25, Shabnam owes 50
      // Expense 5: Shabnam paid 200, all owe 66.67 (200/3)

      // Calculate exact values
      const expense1Split = 100 / 3 // 33.333...
      const expense5Split = 200 / 3 // 66.666...
      
      // Vansh: paid 100+75=175, owes 33.33+133.33+125+25+66.67=383.33
      const vanshNet = 175 - (expense1Split + 133.33 + 125 + 25 + expense5Split)
      
      // Shabnam: paid 333.33+200=533.33, owes 33.33+116.67+83.33+50+66.67=350
      const shabnamNet = 533.33 - (expense1Split + 116.67 + 83.33 + 50 + expense5Split)
      
      // Global Gully: paid 250, owes 33.33+83.33+41.67+66.67=225
      const globalGullyNet = 250 - (expense1Split + 83.33 + 41.67 + expense5Split)

      const netBalances: UserNetBalance[] = [
        {
          user_id: vanshId,
          net_balance: vanshNet,
        },
        {
          user_id: shabnamId,
          net_balance: shabnamNet,
        },
        {
          user_id: globalGullyId,
          net_balance: globalGullyNet,
        },
      ]

      // Calculate expected values based on actual calculations
      // Vansh: 175 - (33.33 + 133.33 + 125 + 25 + 66.67) = 175 - 383.33 = -208.33
      // Shabnam: 533.33 - (33.33 + 116.67 + 83.33 + 50 + 66.67) = 533.33 - 350 = 183.33
      // Global Gully: 250 - (33.33 + 83.33 + 41.67 + 66.67) = 250 - 225 = 25.00

      expect(vanshNet).toBeCloseTo(-208.33, 1)
      expect(shabnamNet).toBeCloseTo(183.33, 1)
      expect(globalGullyNet).toBeCloseTo(25.00, 1)

      const simplified = simplifyDebts(netBalances)
      // Should have transactions to settle debts
      expect(simplified.length).toBeGreaterThanOrEqual(1)
      expect(simplified.length).toBeLessThanOrEqual(2)
      
      // Verify total debts match
      const totalDebt = simplified.reduce((sum, d) => sum + d.amount, 0)
      const totalOwed = netBalances
        .filter(b => b.net_balance < 0)
        .reduce((sum, b) => sum + Math.abs(b.net_balance), 0)
      expect(totalDebt).toBeCloseTo(totalOwed, 1)
    })
  })

  test('Split validation works correctly', () => {
    const amount = 100.00
    const splits: ExpenseSplit[] = [
      { user_id: 'user1', owed_amount: 50.00 },
      { user_id: 'user2', owed_amount: 50.00 },
    ]
    
    const validation = validateSplits(amount, splits)
    expect(validation.valid).toBe(true)
    
    const invalidSplits: ExpenseSplit[] = [
      { user_id: 'user1', owed_amount: 60.00 },
      { user_id: 'user2', owed_amount: 50.00 },
    ]
    
    const invalidValidation = validateSplits(amount, invalidSplits)
    expect(invalidValidation.valid).toBe(false)
  })
})

