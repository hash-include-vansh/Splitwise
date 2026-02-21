import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with the service role key.
 * This client bypasses Row Level Security and should ONLY be used
 * in server-side code (API routes, server components) — never in the browser.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable to be set.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
