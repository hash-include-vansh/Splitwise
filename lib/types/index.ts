export type SplitType = 'equal' | 'unequal' | 'percentage' | 'shares'

export interface ExpenseSplit {
  user_id: string
  owed_amount: number
}

export interface CreateExpenseData {
  group_id: string
  paid_by: string
  amount: number
  description: string
  split_type: SplitType
  splits: ExpenseSplit[]
  excluded_members?: string[]
}

export interface User {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  user?: User
}

export interface Expense {
  id: string
  group_id: string
  paid_by: string
  amount: number
  description: string
  simplified: boolean
  created_at: string
  paid_by_user?: User
  splits?: ExpenseSplitDetail[]
}

export interface ExpenseSplitDetail {
  id: string
  expense_id: string
  user_id: string
  owed_amount: number
  user?: User
}

export interface GroupInvite {
  id: string
  group_id: string
  invite_token: string
  expires_at: string
  created_at: string
}

export interface RawBalance {
  from_user_id: string
  to_user_id: string
  amount: number
  from_user?: User
  to_user?: User
}

export interface SimplifiedDebt {
  from_user_id: string
  to_user_id: string
  amount: number
  from_user?: User
  to_user?: User
}

export interface UserNetBalance {
  user_id: string
  net_balance: number
  user?: User
}

