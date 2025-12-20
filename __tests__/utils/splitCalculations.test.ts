import {
  calculateEqualSplit,
  calculateUnequalSplit,
  calculatePercentageSplit,
  calculateShareSplit,
  validateSplits,
  normalizeSplits,
} from '@/lib/utils/splitCalculations'

describe('splitCalculations', () => {
  describe('calculateEqualSplit', () => {
    it('should split amount equally among members', () => {
      const result = calculateEqualSplit(100, ['user1', 'user2', 'user3'])
      expect(result).toHaveLength(3)
      expect(result[0].owed_amount).toBeCloseTo(33.33, 2)
      expect(result[1].owed_amount).toBeCloseTo(33.33, 2)
      expect(result[2].owed_amount).toBeCloseTo(33.34, 2)
    })

    it('should handle single member', () => {
      const result = calculateEqualSplit(100, ['user1'])
      expect(result).toHaveLength(1)
      expect(result[0].owed_amount).toBe(100)
    })

    it('should return empty array for no members', () => {
      const result = calculateEqualSplit(100, [])
      expect(result).toHaveLength(0)
    })
  })

  describe('calculateUnequalSplit', () => {
    it('should split by exact amounts', () => {
      const result = calculateUnequalSplit(100, {
        user1: 50,
        user2: 30,
        user3: 20,
      })
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.user_id === 'user1')?.owed_amount).toBe(50)
      expect(result.find((s) => s.user_id === 'user2')?.owed_amount).toBe(30)
      expect(result.find((s) => s.user_id === 'user3')?.owed_amount).toBe(20)
    })
  })

  describe('calculatePercentageSplit', () => {
    it('should split by percentages', () => {
      const result = calculatePercentageSplit(100, {
        user1: 50,
        user2: 30,
        user3: 20,
      })
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.user_id === 'user1')?.owed_amount).toBe(50)
      expect(result.find((s) => s.user_id === 'user2')?.owed_amount).toBe(30)
      expect(result.find((s) => s.user_id === 'user3')?.owed_amount).toBe(20)
    })
  })

  describe('calculateShareSplit', () => {
    it('should split by shares', () => {
      const result = calculateShareSplit(100, {
        user1: 2,
        user2: 1,
        user3: 1,
      })
      expect(result).toHaveLength(3)
      expect(result.find((s) => s.user_id === 'user1')?.owed_amount).toBeCloseTo(50, 2)
      expect(result.find((s) => s.user_id === 'user2')?.owed_amount).toBeCloseTo(25, 2)
      expect(result.find((s) => s.user_id === 'user3')?.owed_amount).toBeCloseTo(25, 2)
    })
  })

  describe('validateSplits', () => {
    it('should validate correct splits', () => {
      const splits = [
        { user_id: 'user1', owed_amount: 50 },
        { user_id: 'user2', owed_amount: 30 },
        { user_id: 'user3', owed_amount: 20 },
      ]
      const result = validateSplits(100, splits)
      expect(result.valid).toBe(true)
    })

    it('should reject incorrect splits', () => {
      const splits = [
        { user_id: 'user1', owed_amount: 50 },
        { user_id: 'user2', owed_amount: 30 },
        { user_id: 'user3', owed_amount: 10 },
      ]
      const result = validateSplits(100, splits)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should allow small rounding differences', () => {
      const splits = [
        { user_id: 'user1', owed_amount: 33.33 },
        { user_id: 'user2', owed_amount: 33.33 },
        { user_id: 'user3', owed_amount: 33.34 },
      ]
      const result = validateSplits(100, splits)
      expect(result.valid).toBe(true)
    })
  })

  describe('normalizeSplits', () => {
    it('should normalize equal splits', () => {
      const result = normalizeSplits('equal', 100, {
        memberIds: ['user1', 'user2', 'user3'],
      })
      expect(result).toHaveLength(3)
      const total = result.reduce((sum, s) => sum + s.owed_amount, 0)
      expect(total).toBeCloseTo(100, 2)
    })

    it('should exclude members', () => {
      const result = normalizeSplits('equal', 100, {
        memberIds: ['user1', 'user2', 'user3'],
        excludedIds: ['user3'],
      })
      expect(result).toHaveLength(2)
      expect(result.find((s) => s.user_id === 'user3')).toBeUndefined()
    })
  })
})

