import Link from 'next/link'
import { UserMenu } from '@/components/auth/UserMenu'

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/groups" className="text-xl font-bold text-gray-900">
            Expense Splitter
          </Link>
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}

