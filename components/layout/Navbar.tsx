import Link from 'next/link'
import { UserMenu } from '@/components/auth/UserMenu'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link 
            href="/groups" 
            className="text-2xl font-black text-gray-900 tracking-tight hover:opacity-80 transition-opacity"
            style={{ letterSpacing: '-0.03em' }}
          >
            Splitwise
          </Link>
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}

