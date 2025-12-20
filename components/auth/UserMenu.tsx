'use client'

import { signOut, getCurrentUser } from '@/lib/services/auth'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      const { user } = await getCurrentUser()
      setUser(user)
      
      // Fetch user profile from database
      if (user) {
        const supabase = createClient()
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        setUserProfile(data)
      }
      
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
  }

  if (!user) {
    return null
  }

  // Get avatar URL from user metadata or profile
  const avatarUrl = userProfile?.avatar_url || 
                    user.user_metadata?.avatar_url || 
                    user.user_metadata?.picture
  const displayName = userProfile?.name || 
                     user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     'User'

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100"
      >
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700">
            {displayName[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

