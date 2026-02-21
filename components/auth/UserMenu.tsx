'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronDown } from 'lucide-react'

interface UserMenuProps {
  initialUser?: User | null
}

export function UserMenu({ initialUser }: UserMenuProps) {
  // Initialize with initialUser from server (if available)
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(!initialUser)
  const [showMenu, setShowMenu] = useState(false)
  
  // Fetch user on mount
  useEffect(() => {
    let mounted = true
    
    async function fetchUserProfile(userId: string) {
      const supabase = createClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (mounted && data) {
        setUserProfile(data)
      }
    }
    
    async function fetchUser() {
      try {
        // Fetch from server API (server can read cookies properly)
        const response = await fetch('/api/user')
        const data = await response.json()
        
        if (mounted && data.user) {
          setUser(data.user)
          await fetchUserProfile(data.user.id)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    // If we have initialUser, just fetch the profile
    if (initialUser) {
      fetchUserProfile(initialUser.id)
    } else {
      // Otherwise fetch user from API
      fetchUser()
    }
    
    return () => {
      mounted = false
    }
  }, [initialUser])

  const handleSignOut = async () => {
    // Use server-side signout to properly clear httpOnly cookies
    window.location.href = '/auth/signout'
  }

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
  }

  if (!user) {
    return null
  }

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
        className="flex items-center gap-3 rounded-2xl p-1.5 pr-3 transition-all hover:bg-gray-100/80 dark:hover:bg-gray-700/80 active:scale-95"
      >
        <Avatar
          src={avatarUrl}
          alt={displayName}
          name={displayName}
          email={user.email}
          size="sm"
        />
        <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 z-20 mt-3 w-64 rounded-2xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                {displayName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 truncate font-medium">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-5 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
