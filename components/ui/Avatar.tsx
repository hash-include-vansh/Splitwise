'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

// Module-level cache of URLs that have failed to load.
// Prevents re-requesting broken/rate-limited images across all Avatar instances.
const failedUrls = new Set<string>()

interface AvatarProps {
  src?: string | null
  alt: string
  name?: string | null
  email?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizePx: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
}

export function Avatar({ src, alt, name, email, size = 'md', className = '' }: AvatarProps) {
  const alreadyFailed = src ? failedUrls.has(src) : false
  const [imageError, setImageError] = useState(alreadyFailed)

  // If the src changes and was previously marked failed, update state
  useEffect(() => {
    if (src && failedUrls.has(src)) {
      setImageError(true)
    } else {
      setImageError(false)
    }
  }, [src])

  const handleImageError = () => {
    if (src) failedUrls.add(src)
    setImageError(true)
  }

  const sizeClasses: Record<string, string> = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  const displayName = name || email || 'User'
  const initial = displayName[0]?.toUpperCase() || 'U'
  const showImage = src && !imageError
  const pixels = sizePx[size]

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {showImage && (
        <Image
          src={src}
          alt={alt}
          width={pixels}
          height={pixels}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={handleImageError}
        />
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 font-bold text-white ${
          showImage ? 'hidden' : 'flex'
        } ${sizeClasses[size]}`}
      >
        {initial}
      </div>
    </div>
  )
}
