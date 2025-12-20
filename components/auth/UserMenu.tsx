'use client'

import { signOut, getCurrentUser } from '@/lib/services/auth'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronDown } from 'lucide-react'

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

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
        className="flex items-center gap-3 rounded-2xl p-1.5 pr-3 transition-all hover:bg-gray-100/80 active:scale-95"
      >
        <Avatar
          src={avatarUrl}
          alt={displayName}
          name={displayName}
          email={user.email}
          size="sm"
        />
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 z-20 mt-3 w-64 rounded-2xl bg-white shadow-xl overflow-hidden border border-gray-200/60">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <p className="text-base font-bold text-gray-900 mb-0.5 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                {displayName}
              </p>
              <p className="text-sm text-gray-500 truncate font-medium">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-5 py-4 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

