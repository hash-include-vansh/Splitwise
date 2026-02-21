'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserMenu } from '@/components/auth/UserMenu'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  initialUser?: User | null
}

export function Navbar({ initialUser }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/80">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href="/groups"
              className="text-2xl font-black text-gray-900 dark:text-white tracking-tight hover:opacity-80 transition-opacity"
              style={{ letterSpacing: '-0.03em' }}
            >
              SplitKaroBhai
            </Link>
          </motion.div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ThemeToggle />
            <NotificationBell userId={initialUser?.id} />
            <UserMenu initialUser={initialUser} />
          </motion.div>
        </div>
      </div>
    </nav>
  )
}
