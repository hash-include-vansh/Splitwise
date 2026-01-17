'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Fetch user from server API (server can read cookies properly)
    async function fetchUser() {
      try {
        const response = await fetch('/api/user')
        const data = await response.json()
        
        if (mounted) {
          setUser(data.user || null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }
    
    fetchUser()

    // Refetch on window focus to keep session updated
    const handleFocus = () => {
      fetchUser()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      mounted = false
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return { user, session: null, loading }
}

