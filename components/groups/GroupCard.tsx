import Link from 'next/link'
import type { Group } from '@/lib/types'
import { Users, ChevronRight } from 'lucide-react'

interface GroupCardProps {
  group: Group & { created_by_user?: { name?: string; email?: string } | null }
}

export function GroupCard({ group }: GroupCardProps) {
  const creatorName = group.created_by_user?.name || group.created_by_user?.email || 'Unknown'
  
  return (
    <Link
      href={`/groups/${group.id}`}
      className="group block rounded-xl bg-white border border-gray-200/60 p-5 shadow-elegant hover:shadow-medium hover:border-gray-300/60 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-white">
            <Users className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-1 truncate tracking-tight" style={{ letterSpacing: '-0.01em' }}>
              {group.name}
            </h3>
            <p className="text-sm font-medium text-gray-500 truncate">
              Created by {creatorName}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 flex-shrink-0 transition-colors duration-200" />
      </div>
    </Link>
  )
}

