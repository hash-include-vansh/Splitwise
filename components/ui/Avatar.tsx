'use client'

import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  alt: string
  name?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, alt, name, email, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  const displayName = name || email || 'User'
  const initial = displayName[0]?.toUpperCase() || 'U'

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      ) : null}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full bg-gray-300 font-medium text-gray-700 ${
          src && !imageError ? 'hidden' : 'flex'
        } ${sizeClasses[size]}`}
      >
        {initial}
      </div>
    </div>
  )
}

