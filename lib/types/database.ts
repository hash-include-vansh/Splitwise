export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          paid_by: string
          amount: number
          description: string
          simplified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          paid_by: string
          amount: number
          description: string
          simplified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          paid_by?: string
          amount?: number
          description?: string
          simplified?: boolean
          created_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          owed_amount: number
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          owed_amount: number
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          owed_amount?: number
        }
      }
      group_invites: {
        Row: {
          id: string
          group_id: string
          invite_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          invite_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          invite_token?: string
          expires_at?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          group_id: string
          debtor_id: string
          creditor_id: string
          amount: number
          status: 'pending' | 'accepted' | 'rejected'
          marked_by: string
          accepted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          debtor_id: string
          creditor_id: string
          amount: number
          status?: 'pending' | 'accepted' | 'rejected'
          marked_by: string
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          debtor_id?: string
          creditor_id?: string
          amount?: number
          status?: 'pending' | 'accepted' | 'rejected'
          marked_by?: string
          accepted_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'group_created' | 'group_joined' | 'expense_added' | 'payment_pending' | 'payment_accepted' | 'payment_rejected' | 'friend_added' | 'group_settled'
          title: string
          message: string
          metadata: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'group_created' | 'group_joined' | 'expense_added' | 'payment_pending' | 'payment_accepted' | 'payment_rejected' | 'friend_added' | 'group_settled'
          title: string
          message: string
          metadata?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'group_created' | 'group_joined' | 'expense_added' | 'payment_pending' | 'payment_accepted' | 'payment_rejected' | 'friend_added' | 'group_settled'
          title?: string
          message?: string
          metadata?: Json
          read?: boolean
          created_at?: string
        }
      }
    }
  }
}

