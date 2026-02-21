import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Migrations to run - each has a test query and the ALTER statement
const MIGRATIONS = [
  {
    name: 'emoji_column',
    table: 'groups',
    column: 'emoji',
    sql: 'ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT NULL;',
  },
  {
    name: 'category_column',
    table: 'expenses',
    column: 'category',
    sql: "ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';",
  },
]

// POST /api/migrate - Run pending migrations
export async function POST() {
  try {
    const admin = createAdminClient()

    if (!admin) {
      return NextResponse.json({
        migrationNeeded: true,
        message: 'Service role key not configured.',
      }, { status: 503 })
    }

    const results: { name: string; status: string }[] = []
    let anyNeeded = false

    for (const migration of MIGRATIONS) {
      // Check if column already exists
      const { error: testError } = await admin
        .from(migration.table)
        .select(migration.column)
        .limit(1)

      if (!testError) {
        results.push({ name: migration.name, status: 'already_exists' })
        continue
      }

      anyNeeded = true

      // Column doesn't exist — attempt migration via Supabase Management API
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const projectRef = supabaseUrl.replace('https://', '').split('.')[0]

      const mgmtResponse = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            query: migration.sql,
          }),
        }
      )

      if (mgmtResponse.ok) {
        results.push({ name: migration.name, status: 'migrated' })
      } else {
        results.push({ name: migration.name, status: 'failed' })
      }
    }

    if (!anyNeeded) {
      return NextResponse.json({
        migrationNeeded: false,
        message: 'All migrations are up to date',
        results,
      })
    }

    const allSucceeded = results.every(r => r.status !== 'failed')

    return NextResponse.json({
      migrationNeeded: !allSucceeded,
      message: allSucceeded ? 'All migrations completed successfully' : 'Some migrations failed',
      results,
    }, { status: allSucceeded ? 200 : 500 })
  } catch {
    return NextResponse.json({
      error: 'Migration check failed',
    }, { status: 500 })
  }
}

// GET /api/migrate - Check migration status
export async function GET() {
  try {
    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({
        status: 'unknown',
        message: 'Service role key not configured',
      })
    }

    const results: Record<string, boolean> = {}

    for (const migration of MIGRATIONS) {
      const { error } = await admin
        .from(migration.table)
        .select(migration.column)
        .limit(1)

      results[migration.name] = !error
    }

    const allPresent = Object.values(results).every(Boolean)

    return NextResponse.json({
      ...results,
      allMigrationsApplied: allPresent,
      message: allPresent ? 'All columns present' : 'Some columns missing',
    })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
