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
    
    // Start auto-refresh
    supabase.auth.startAutoRefresh()

    // Periodically refresh session (every 30 minutes) to ensure it stays alive
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Refresh the session to extend its lifetime
          await supabase.auth.refreshSession()
        }
      } catch (error) {
          console.error('Error refreshing session:', error)
        }
      }, 30 * 60 * 1000) // 30 minutes

    return () => {
      clearInterval(refreshInterval)
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

