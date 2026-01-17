import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[API /api/user] GET request received')
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log('[API /api/user] getUser result:', { 
    hasUser: !!user, 
    userId: user?.id, 
    error: error?.message 
  })

  if (error || !user) {
    console.log('[API /api/user] Returning null user')
    return NextResponse.json({ user: null }, { status: 200 })
  }

  console.log('[API /api/user] Returning user:', user.id)
  return NextResponse.json({ user }, { status: 200 })
}

