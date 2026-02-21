'use client'

import { GroupCard } from './GroupCard'
import { GroupListSkeleton } from '@/components/ui/Skeleton'
import { motion } from 'framer-motion'
import type { Group } from '@/lib/types'
import { Users } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/lib/animations'

interface GroupListProps {
  groups: Group[]
  isLoading?: boolean
}

export function GroupList({ groups, isLoading }: GroupListProps) {
  if (isLoading) {
    return <GroupListSkeleton count={5} />
  }

  if (groups.length === 0) {
    return (
      <motion.div
        className="text-center py-24"
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={fadeInUp.transition}
      >
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-900 dark:bg-gray-100 mb-6">
            <Users className="h-10 w-10 text-white dark:text-gray-900" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            No groups yet
          </h3>
          <p className="text-base font-medium text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Create your first group to start splitting expenses with friends.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </motion.div>
  )
}
