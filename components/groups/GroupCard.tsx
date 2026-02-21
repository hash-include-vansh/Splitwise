'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Group } from '@/lib/types'
import { Users, ChevronRight } from 'lucide-react'
import { DEFAULT_GROUP_EMOJI } from '@/lib/constants/groupEmojis'
import { staggerItem } from '@/lib/animations'

interface GroupCardProps {
  group: Group & { created_by_user?: { name?: string; email?: string } | null }
}

export function GroupCard({ group }: GroupCardProps) {
  const creatorName = group.created_by_user?.name || group.created_by_user?.email || 'Unknown'
  const emoji = group.emoji || DEFAULT_GROUP_EMOJI

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2 }}
    >
      <Link
        href={`/groups/${group.id}`}
        className="group block rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 p-5 shadow-elegant hover:shadow-medium hover:border-gray-300/60 dark:hover:border-gray-600/60 transition-all duration-200"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-2xl group-hover:scale-110 transition-transform duration-200">
              {emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                {group.name}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-500 truncate">
                Created by {creatorName}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  )
}
