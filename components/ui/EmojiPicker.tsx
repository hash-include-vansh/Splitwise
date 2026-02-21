'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GROUP_EMOJI_OPTIONS } from '@/lib/constants/groupEmojis'
import { popIn } from '@/lib/animations'

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export function EmojiPicker({ value, onChange, size = 'md' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sizeClasses = {
    sm: 'h-10 w-10 text-xl',
    md: 'h-14 w-14 text-3xl',
    lg: 'h-20 w-20 text-5xl',
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer`}
        title="Pick an emoji"
      >
        <span className="leading-none">{value}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-gray-200/60 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-xl"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">Pick an emoji for your group</p>
            <div className="grid grid-cols-8 gap-1">
              {GROUP_EMOJI_OPTIONS.map((emoji, i) => (
                <motion.button
                  key={`${emoji}-${i}`}
                  type="button"
                  onClick={() => {
                    onChange(emoji)
                    setIsOpen(false)
                  }}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg text-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    value === emoji ? 'bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-900 dark:ring-white scale-110' : ''
                  }`}
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
