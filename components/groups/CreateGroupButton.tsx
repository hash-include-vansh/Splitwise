'use client'

import { useState } from 'react'
import { CreateGroupModal } from './CreateGroupModal'

export function CreateGroupButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Create Group
      </button>
      <CreateGroupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

