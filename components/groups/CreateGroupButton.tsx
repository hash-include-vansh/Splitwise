'use client'

import { useState } from 'react'
import { CreateGroupModal } from './CreateGroupModal'
import { Plus } from 'lucide-react'

export function CreateGroupButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 sm:gap-3 rounded-xl bg-black px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white shadow-elegant hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90 duration-200" />
        <span>Create Group</span>
      </button>
      <CreateGroupModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

