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
  category?: string
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
  emoji?: string
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
  category?: string
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
  amount: number  // Current outstanding amount (after payments)
  originalAmount?: number  // Original amount before payments
  paidAmount?: number  // Amount that has been paid
  isSettled?: boolean  // True if fully paid
  from_user?: User
  to_user?: User
}

export interface SimplifiedDebt {
  from_user_id: string
  to_user_id: string
  amount: number  // Current outstanding amount
  originalAmount?: number  // Original amount before payments
  paidAmount?: number  // Amount that has been paid
  isSettled?: boolean  // True if fully paid
  from_user?: User
  to_user?: User
}

export interface UserNetBalance {
  user_id: string
  net_balance: number
  user?: User
}

export type PaymentStatus = 'pending' | 'accepted' | 'rejected'

export interface Payment {
  id: string
  group_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  status: PaymentStatus
  marked_by: string
  accepted_by: string | null
  created_at: string
  updated_at: string
  debtor?: User
  creditor?: User
  marked_by_user?: User
  accepted_by_user?: User
}

export interface Friendship {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1?: User
  user2?: User
}

export type NotificationType =
  | 'group_created'
  | 'group_joined'
  | 'expense_added'
  | 'payment_pending'
  | 'payment_accepted'
  | 'payment_rejected'
  | 'payment_reminder'
  | 'friend_added'
  | 'group_settled'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  metadata: Record<string, any>
  read: boolean
  created_at: string
}

