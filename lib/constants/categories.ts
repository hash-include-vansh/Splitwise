import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  Home,
  Plane,
  Heart,
  ShoppingCart,
  Coffee,
  Wine,
  CreditCard,
  Gift,
  MoreHorizontal,
  Receipt,
  type LucideIcon,
} from 'lucide-react'

export interface ExpenseCategory {
  key: string
  label: string
  icon: LucideIcon
  bgColor: string    // Tailwind bg class for the icon container
  textColor: string  // Tailwind text class for the icon
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { key: 'general', label: 'General', icon: Receipt, bgColor: 'bg-gray-900', textColor: 'text-white' },
  { key: 'food', label: 'Food', icon: Utensils, bgColor: 'bg-orange-500', textColor: 'text-white' },
  { key: 'groceries', label: 'Groceries', icon: ShoppingCart, bgColor: 'bg-green-500', textColor: 'text-white' },
  { key: 'transport', label: 'Transport', icon: Car, bgColor: 'bg-blue-500', textColor: 'text-white' },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag, bgColor: 'bg-pink-500', textColor: 'text-white' },
  { key: 'entertainment', label: 'Entertainment', icon: Film, bgColor: 'bg-purple-500', textColor: 'text-white' },
  { key: 'utilities', label: 'Utilities', icon: Zap, bgColor: 'bg-yellow-500', textColor: 'text-white' },
  { key: 'rent', label: 'Rent', icon: Home, bgColor: 'bg-indigo-500', textColor: 'text-white' },
  { key: 'travel', label: 'Travel', icon: Plane, bgColor: 'bg-cyan-500', textColor: 'text-white' },
  { key: 'health', label: 'Health', icon: Heart, bgColor: 'bg-red-500', textColor: 'text-white' },
  { key: 'coffee', label: 'Coffee', icon: Coffee, bgColor: 'bg-amber-700', textColor: 'text-white' },
  { key: 'drinks', label: 'Drinks', icon: Wine, bgColor: 'bg-rose-500', textColor: 'text-white' },
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, bgColor: 'bg-violet-500', textColor: 'text-white' },
  { key: 'gifts', label: 'Gifts', icon: Gift, bgColor: 'bg-teal-500', textColor: 'text-white' },
  { key: 'other', label: 'Other', icon: MoreHorizontal, bgColor: 'bg-gray-500', textColor: 'text-white' },
]

export const CATEGORY_MAP: Record<string, ExpenseCategory> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((cat) => [cat.key, cat])
)

export function getCategoryByKey(key: string | undefined | null): ExpenseCategory {
  return CATEGORY_MAP[key || 'general'] || CATEGORY_MAP['general']
}
