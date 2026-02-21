import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SeedDemoData from './SeedDemoData'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if emoji column exists
  const { error: emojiError } = await supabase
    .from('groups')
    .select('emoji')
    .limit(1)

  const emojiColumnExists = !emojiError

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || ''
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Database Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Run pending migrations to enable all features.
        </p>

        <div className="space-y-4">
          {/* Emoji column migration */}
          <div className={`rounded-xl border p-5 ${
            emojiColumnExists
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-sm ${
                emojiColumnExists
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {emojiColumnExists ? '✓' : '!'}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Group Emoji Icons
                </h3>
                {emojiColumnExists ? (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Emoji column is configured. Group icons are working.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                      The emoji column needs to be added to the groups table.
                    </p>
                    <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-3 mb-3">
                      <code className="text-sm text-green-400 font-mono select-all">
                        ALTER TABLE groups ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT NULL;
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={sqlEditorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-black dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
                      >
                        Open SQL Editor
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-500 self-center">
                        Paste the SQL above and click &quot;Run&quot;
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Demo data seeder */}
          <SeedDemoData />
        </div>

        <div className="mt-8">
          <a
            href="/groups"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Back to Groups
          </a>
        </div>
      </div>
    </div>
  )
}
