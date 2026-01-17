'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { createClient } from '@/lib/supabase/client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch if data is still fresh
            refetchOnReconnect: true,
            retry: 1, // Only retry once on failure
            // Deduplicate queries - if same query is made multiple times, only fetch once
            queryKeyHashFn: (queryKey) => JSON.stringify(queryKey),
          },
        },
      })
  )

  // Set up session refresh to keep user logged in
  useEffect(() => {
    const supabase = createClient()
    
    // Start auto-refresh - this handles automatic token refresh before expiration
    supabase.auth.startAutoRefresh()

    // Function to refresh session
    const refreshSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          return
        }
        if (session) {
          // Refresh the session with the current session to extend its lifetime
          // This is critical - passing the session ensures the refresh token is used correctly
          const { error: refreshError } = await supabase.auth.refreshSession(session)
          if (refreshError) {
            console.error('Error refreshing session:', refreshError)
          }
        }
      } catch (error) {
        console.error('Error refreshing session:', error)
      }
    }

    // Periodically refresh session proactively to prevent expiration
    // Supabase sessions typically expire after 1 hour, so refresh every 50 minutes
    // This ensures we refresh before expiration
    const refreshInterval = setInterval(refreshSession, 50 * 60 * 1000) // 50 minutes

    // Refresh session when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSession()
      }
    }

    // Refresh session when window gains focus (user switches back to window)
    const handleFocus = () => {
      refreshSession()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(refreshInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      supabase.auth.stopAutoRefresh()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container"
        toastClassName="toast"
      />
    </QueryClientProvider>
  )
}

