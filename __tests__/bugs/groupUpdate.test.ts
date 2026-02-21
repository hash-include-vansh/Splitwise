/**
 * Bug 2: Group name not updating in other screens after save
 * Bug 3: Emoji change shows success but never persists
 *
 * Root causes:
 * Bug 2: The group detail page (GroupDetailClient) uses local `useState(initialGroup)`
 *   instead of React Query. After settings page calls updateGroup and invalidates
 *   queryKeys.groups.detail(groupId), the invalidation reaches React Query cache
 *   but NOT the local state in GroupDetailClient. Additionally, the settings page
 *   itself uses server-rendered `initialGroup` props, so even after mutation success
 *   the local state doesn't reflect the new data. The fix requires:
 *   - GroupDetailClient should use `useGroupDetails()` hook (React Query) to stay in sync
 *   - Settings page should also use useGroupDetails() or router.refresh() after save
 *
 * Bug 3: The database doesn't have the `emoji` column (schema.sql was never migrated).
 *   The `updateGroup` function catches the emoji-related error and silently retries
 *   without emoji — so name updates succeed but emoji is dropped. The fix requires:
 *   - Creating an actual migration to add the emoji column to the live database
 *   - OR: Making the UI clearly indicate when emoji can't be saved
 */
import { updateGroup, createGroup } from '@/lib/services/groups-client'

// Mock Supabase client
const mockSelect = jest.fn()
const mockSingle = jest.fn()
const mockUpdate = jest.fn()
const mockInsert = jest.fn()
const mockEq = jest.fn()
const mockFrom = jest.fn()
const mockDelete = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      mockFrom(table)
      return {
        insert: (data: any) => {
          mockInsert(data)
          return {
            select: () => {
              mockSelect()
              return { single: () => mockSingle() }
            }
          }
        },
        update: (data: any) => {
          mockUpdate(data)
          return {
            eq: (col: string, val: string) => {
              mockEq(col, val)
              return {
                select: () => {
                  mockSelect()
                  return { single: () => mockSingle() }
                }
              }
            }
          }
        },
        select: () => ({
          eq: (col: string, val: string) => {
            mockEq(col, val)
            return {
              eq: (col2: string, val2: string) => {
                mockEq(col2, val2)
                return { single: () => mockSingle() }
              },
              single: () => mockSingle()
            }
          }
        }),
        delete: () => {
          mockDelete()
          return {
            eq: () => ({ error: null })
          }
        }
      }
    },
    auth: {
      getUser: () => mockGetUser()
    }
  })
}))

// Mock global fetch for triggerEmojiMigration
global.fetch = jest.fn().mockResolvedValue({ ok: true })

beforeEach(() => {
  jest.clearAllMocks()
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
})

describe('Bug 2: updateGroup must return updated data for cache invalidation', () => {
  test('updateGroup sends name in update payload', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    // Mock admin check
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null }) // admin check
      .mockResolvedValueOnce({ data: { id: 'group-1', name: 'New Name' }, error: null }) // update result

    const result = await updateGroup('group-1', 'New Name')

    // Verify that .update() was called with the correct name
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Name' })
    )
  })

  test('updateGroup returns the updated group data (not stale)', async () => {
    const updatedGroup = { id: 'group-1', name: 'Updated Name', created_by: 'user-1', created_at: '2024-01-01' }

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
      .mockResolvedValueOnce({ data: updatedGroup, error: null })

    const result = await updateGroup('group-1', 'Updated Name')

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.name).toBe('Updated Name')
  })

  test('updateGroup trims whitespace from name', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'group-1', name: 'Trimmed' }, error: null })

    await updateGroup('group-1', '  Trimmed  ')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Trimmed' })
    )
  })

  test('updateGroup rejects empty name', async () => {
    const result = await updateGroup('group-1', '')
    expect(result.error).not.toBeNull()
    expect(result.error?.message).toContain('required')
  })

  test('updateGroup rejects whitespace-only name', async () => {
    const result = await updateGroup('group-1', '   ')
    expect(result.error).not.toBeNull()
    expect(result.error?.message).toContain('required')
  })
})

describe('Bug 3: updateGroup emoji handling', () => {
  // IMPORTANT: createGroup emoji test must run BEFORE the fallback test,
  // because the fallback test sets module-level emojiColumnAvailable=false
  test('createGroup includes emoji in insert payload when column is available', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: 'group-new', name: 'New Group', emoji: '🏠' }, error: null })
    // Mock the member insert (no single needed)
    mockEq.mockReturnValue({ error: null })

    await createGroup('New Group', 'user-1', '🏠')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ emoji: '🏠', name: 'New Group', created_by: 'user-1' })
    )
  })

  test('updateGroup includes emoji in update payload when provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'group-1', name: 'Test', emoji: '🎉' }, error: null })

    await updateGroup('group-1', 'Test', '🎉')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ emoji: '🎉' })
    )
  })

  test('updateGroup falls back gracefully when emoji column missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
      // First attempt fails with emoji error
      .mockResolvedValueOnce({ data: null, error: { message: "Could not find the 'emoji' column of 'groups' in the schema cache" } })
      // Retry without emoji succeeds
      .mockResolvedValueOnce({ data: { id: 'group-1', name: 'Test' }, error: null })

    const result = await updateGroup('group-1', 'Test', '🎉')

    // Should succeed with retry (name still updates even if emoji fails)
    expect(result.data).not.toBeNull()
    expect(result.data?.name).toBe('Test')
  })

  test('after emoji column error, subsequent calls skip emoji to avoid 400s', async () => {
    // After the previous test set emojiColumnAvailable=false,
    // this test verifies that emoji is NOT included in update payload
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle
      .mockResolvedValueOnce({ data: { role: 'admin' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'group-1', name: 'Another Test' }, error: null })

    await updateGroup('group-1', 'Another Test', '🎯')

    // Should NOT include emoji since column was detected as unavailable
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Another Test' })
  })
})

describe('Bug 2: Query key structure for cache invalidation', () => {
  test('queryKeys.groups.detail generates correct key for a groupId', () => {
    // Import inside to avoid module resolution issues with mocks
    const { queryKeys } = require('@/lib/queries/keys')

    const key = queryKeys.groups.detail('group-123')
    expect(key).toEqual(['groups', 'detail', 'group-123'])
  })

  test('queryKeys.groups.list generates correct key for a userId', () => {
    const { queryKeys } = require('@/lib/queries/keys')

    const key = queryKeys.groups.list('user-456')
    expect(key).toEqual(['groups', 'list', 'user-456'])
  })

  test('detail key is a subset of all groups key (for broad invalidation)', () => {
    const { queryKeys } = require('@/lib/queries/keys')

    const allKey = queryKeys.groups.all
    const detailKey = queryKeys.groups.detail('group-123')

    // The detail key should start with the "all" key prefix
    expect(detailKey.slice(0, allKey.length)).toEqual(allKey)
  })
})
