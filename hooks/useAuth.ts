'use client'

import { getCurrentUser, getSession } from '@/lib/services/auth'
import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  return { user, session, loading }
}

