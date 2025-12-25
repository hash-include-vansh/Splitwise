'use client'

import { getCurrentUser, getSession } from '@/lib/services/auth'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Initial fetch
    async function fetchAuth() {
      const [{ user }, { session }] = await Promise.all([
        getCurrentUser(),
        getSession(),
      ])
      setUser(user)
      setSession(session)
      setLoading(false)
    }
    
    fetchAuth()

    // Set up auth state listener to handle session changes and auto-refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(session)
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
      }
      
      setLoading(false)
    })

    // Start auto-refresh for the session
    supabase.auth.startAutoRefresh()

    return () => {
      subscription.unsubscribe()
      supabase.auth.stopAutoRefresh()
    }
  }, [])

  return { user, session, loading }
}

