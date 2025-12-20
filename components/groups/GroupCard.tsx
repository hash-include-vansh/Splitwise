import Link from 'next/link'
import type { Group } from '@/lib/types'

interface GroupCardProps {
  group: Group
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
      <p className="mt-2 text-sm text-gray-500">
        Created {new Date(group.created_at).toLocaleDateString()}
      </p>
    </Link>
  )
}

