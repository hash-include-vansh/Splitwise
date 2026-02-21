/**
 * POST /api/seed
 * Seeds the database with three realistic demo groups from the test scenarios.
 *
 * - Goa Trip 2025 🏖️       (5 people, 14 expenses)
 * - Raghav's Birthday Bash 🎂 (6 people,  9 expenses)
 * - Bangalore Flatmates 🏠   (4 people, 15 expenses)
 *
 * The current authenticated user becomes "Arjun / Sanya / Aditya" (the first
 * member in each group). Remaining members are created as demo Supabase auth
 * users and are visible in the app but cannot log in.
 *
 * DELETE /api/seed
 * Removes all groups + data created by a previous seed call for this user.
 *
 * Security: only works when SUPABASE_SERVICE_ROLE_KEY is set (dev/staging).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Split helpers (mirrors lib/utils/splitCalculations) ─────────────────────

function calcEqual(amount: number, userIds: string[]) {
  const n = userIds.length
  const base = Math.floor((amount / n) * 100) / 100
  const remainder = Math.round((amount - base * n) * 100)
  return userIds.map((user_id, i) => ({
    user_id,
    owed_amount: i < remainder ? base + 0.01 : base,
  }))
}

function calcUnequal(amounts: Record<string, number>) {
  return Object.entries(amounts).map(([user_id, owed_amount]) => ({ user_id, owed_amount }))
}

function calcPercentage(amount: number, percentages: Record<string, number>) {
  const entries = Object.entries(percentages)
  const splits = entries.map(([user_id, pct]) => ({
    user_id,
    owed_amount: Math.round(amount * (pct / 100) * 100) / 100,
  }))
  // Fix rounding remainder on first entry
  const diff = Math.round((amount - splits.reduce((s, x) => s + x.owed_amount, 0)) * 100) / 100
  if (Math.abs(diff) > 0) splits[0].owed_amount = Math.round((splits[0].owed_amount + diff) * 100) / 100
  return splits
}

function calcShares(amount: number, shares: Record<string, number>) {
  const total = Object.values(shares).reduce((s, x) => s + x, 0)
  const entries = Object.entries(shares)
  const splits = entries.map(([user_id, sh]) => ({
    user_id,
    owed_amount: Math.round(amount * (sh / total) * 100) / 100,
  }))
  const diff = Math.round((amount - splits.reduce((s, x) => s + x.owed_amount, 0)) * 100) / 100
  if (Math.abs(diff) > 0) splits[0].owed_amount = Math.round((splits[0].owed_amount + diff) * 100) / 100
  return splits
}

// ─── Demo user definitions ────────────────────────────────────────────────────

interface DemoMember {
  key: string        // short key like 'arjun'
  name: string
  email: string
  avatar_url: string
}

const DEMO_MEMBERS: DemoMember[] = [
  // Goa group
  { key: 'arjun',   name: 'Arjun Mehta',    email: 'demo.arjun@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=4F46E5' },
  { key: 'priya',   name: 'Priya Sharma',   email: 'demo.priya@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=EC4899' },
  { key: 'rohan',   name: 'Rohan Kapoor',   email: 'demo.rohan@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=RK&backgroundColor=10B981' },
  { key: 'meera',   name: 'Meera Joshi',    email: 'demo.meera@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=MJ&backgroundColor=F59E0B' },
  { key: 'dev',     name: 'Dev Patel',      email: 'demo.dev@splitkarobhai.app',     avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=DP&backgroundColor=6366F1' },
  // Birthday group (Raghav, Sanya, Kiran, Tanya, Nikhil, Zara)
  { key: 'raghav',  name: 'Raghav Singh',   email: 'demo.raghav@splitkarobhai.app',  avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=RS&backgroundColor=EF4444' },
  { key: 'sanya',   name: 'Sanya Verma',    email: 'demo.sanya@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=SV&backgroundColor=8B5CF6' },
  { key: 'kiran',   name: 'Kiran Nair',     email: 'demo.kiran@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=KN&backgroundColor=06B6D4' },
  { key: 'tanya',   name: 'Tanya Malhotra', email: 'demo.tanya@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TM&backgroundColor=F97316' },
  { key: 'nikhil',  name: 'Nikhil Gupta',   email: 'demo.nikhil@splitkarobhai.app',  avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=NG&backgroundColor=14B8A6' },
  { key: 'zara',    name: 'Zara Khan',      email: 'demo.zara@splitkarobhai.app',    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=ZK&backgroundColor=F43F5E' },
  // Flatmates group (Aditya, Bhavna, Chirag, Divya)
  { key: 'aditya',  name: 'Aditya Kumar',   email: 'demo.aditya@splitkarobhai.app',  avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AK&backgroundColor=22C55E' },
  { key: 'bhavna',  name: 'Bhavna Reddy',   email: 'demo.bhavna@splitkarobhai.app',  avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=BR&backgroundColor=A855F7' },
  { key: 'chirag',  name: 'Chirag Agarwal', email: 'demo.chirag@splitkarobhai.app',  avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=CA&backgroundColor=3B82F6' },
  { key: 'divya',   name: 'Divya Iyer',     email: 'demo.divya@splitkarobhai.app',   avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=DI&backgroundColor=EC4899' },
]

// ─── Group expense definitions ────────────────────────────────────────────────

function buildGoaExpenses(ids: Record<string, string>) {
  const { arjun: A, priya: P, rohan: R, meera: M, dev: D } = ids
  const allFive = [A, P, R, M, D]
  return [
    { paid_by: A, amount: 32500, date: '2025-01-10T09:00:00Z', category: 'travel',         description: 'Group flight tickets to Goa',          splits: calcUnequal({ [A]: 7000, [P]: 7000, [R]: 7000, [M]: 7000, [D]: 4500 }) },
    { paid_by: P, amount: 1200,  date: '2025-01-10T11:30:00Z', category: 'transport',       description: 'Airport cab to hotel',                  splits: calcEqual(1200, allFive) },
    { paid_by: A, amount: 18000, date: '2025-01-11T14:00:00Z', category: 'rent',            description: 'Hotel stay (3 nights)',                 splits: calcEqual(18000, allFive) },
    { paid_by: P, amount: 3600,  date: '2025-01-11T13:00:00Z', category: 'food',            description: 'Beach restaurant lunch',                splits: calcEqual(3600, allFive) },
    { paid_by: R, amount: 2800,  date: '2025-01-11T19:00:00Z', category: 'drinks',          description: 'Beer & cocktails at beach shack',       splits: calcEqual(2800, [A, P, R, M]) },
    { paid_by: R, amount: 6000,  date: '2025-01-12T10:00:00Z', category: 'entertainment',   description: 'Water sports (Dev skipped)',             splits: calcPercentage(6000, { [A]: 30, [P]: 25, [R]: 25, [M]: 20 }) },
    { paid_by: A, amount: 2500,  date: '2025-01-12T11:00:00Z', category: 'transport',       description: 'Bike rental (Arjun, Rohan, Dev)',        splits: calcShares(2500, { [A]: 2, [R]: 2, [D]: 1 }) },
    { paid_by: M, amount: 4200,  date: '2025-01-12T13:30:00Z', category: 'food',            description: 'Lunch at Curlies beach shack',          splits: calcEqual(4200, allFive) },
    { paid_by: P, amount: 7500,  date: '2025-01-12T17:00:00Z', category: 'entertainment',   description: 'Sunset cruise',                         splits: calcEqual(7500, allFive) },
    { paid_by: R, amount: 4500,  date: '2025-01-12T22:00:00Z', category: 'drinks',          description: 'Night out at Tito\'s (Dev excluded)',   splits: calcEqual(4500, [A, P, R, M]) },
    { paid_by: D, amount: 3000,  date: '2025-01-13T11:00:00Z', category: 'gifts',           description: 'Group souvenirs & fridge magnets',      splits: calcEqual(3000, allFive) },
    { paid_by: A, amount: 12000, date: '2025-01-13T20:00:00Z', category: 'food',            description: 'Fancy farewell dinner (Arjun & Priya had lobster)', splits: calcUnequal({ [A]: 3500, [P]: 3500, [R]: 2000, [M]: 2000, [D]: 1000 }) },
    { paid_by: M, amount: 1800,  date: '2025-01-13T22:00:00Z', category: 'coffee',          description: 'Coffee & desserts after dinner',        splits: calcEqual(1800, allFive) },
    { paid_by: P, amount: 1400,  date: '2025-01-14T08:00:00Z', category: 'transport',       description: 'Return cab to airport',                 splits: calcEqual(1400, allFive) },
  ]
}

function buildBirthdayExpenses(ids: Record<string, string>) {
  const { raghav: R, sanya: S, kiran: K, tanya: T, nikhil: N, zara: Z } = ids
  const allSix = [R, S, K, T, N, Z]
  const paidGuests = [S, K, T, N, Z]
  return [
    { paid_by: K, amount: 8000,  date: '2025-02-15T16:00:00Z', category: 'entertainment',  description: 'Venue deposit – The Loft, Bandra',     splits: calcEqual(8000, paidGuests) },
    { paid_by: S, amount: 5000,  date: '2025-02-15T17:00:00Z', category: 'entertainment',  description: 'DJ & music setup',                     splits: calcEqual(5000, paidGuests) },
    { paid_by: Z, amount: 3500,  date: '2025-02-15T17:30:00Z', category: 'gifts',          description: 'Decorations & balloons',               splits: calcPercentage(3500, { [S]: 25, [K]: 20, [T]: 20, [N]: 15, [Z]: 20 }) },
    { paid_by: N, amount: 2400,  date: '2025-02-15T18:00:00Z', category: 'food',           description: 'Birthday cake from Theobroma',         splits: calcEqual(2400, allSix) },
    { paid_by: T, amount: 12000, date: '2025-02-15T19:00:00Z', category: 'food',           description: 'Catering – starters, mains & desserts', splits: calcEqual(12000, allSix) },
    { paid_by: S, amount: 9000,  date: '2025-02-15T20:00:00Z', category: 'drinks',         description: 'Bar tab – cocktails & mocktails',      splits: calcShares(9000, { [S]: 3, [K]: 2, [T]: 2, [N]: 2, [Z]: 2 }) },
    { paid_by: S, amount: 5000,  date: '2025-02-15T21:00:00Z', category: 'gifts',          description: 'Group gift for Raghav (PS5 game)',     splits: calcEqual(5000, paidGuests) },
    { paid_by: N, amount: 2800,  date: '2025-02-16T01:00:00Z', category: 'food',           description: 'Late-night biryani & kebabs delivery', splits: calcEqual(2800, allSix) },
    { paid_by: K, amount: 1800,  date: '2025-02-16T02:00:00Z', category: 'transport',      description: 'Return cabs (Kiran, Tanya, Zara)',     splits: calcEqual(1800, [K, T, Z]) },
  ]
}

function buildFlatmatesExpenses(ids: Record<string, string>) {
  const { aditya: A, bhavna: B, chirag: C, divya: D } = ids
  const all = [A, B, C, D]
  return [
    { paid_by: A, amount: 48000, date: '2025-01-01T10:00:00Z', category: 'rent',           description: 'January rent – Indiranagar 2BHK',      splits: calcEqual(48000, all) },
    { paid_by: B, amount: 1200,  date: '2025-01-02T11:00:00Z', category: 'utilities',      description: 'ACT broadband – January',               splits: calcEqual(1200, all) },
    { paid_by: D, amount: 4800,  date: '2025-01-05T12:00:00Z', category: 'utilities',      description: 'January electricity (Aditya has AC+desktop)', splits: calcShares(4800, { [A]: 2, [B]: 1, [C]: 1, [D]: 1 }) },
    { paid_by: C, amount: 3600,  date: '2025-01-06T09:00:00Z', category: 'groceries',      description: 'Week 1 groceries – BigBasket order',   splits: calcEqual(3600, all) },
    { paid_by: B, amount: 1500,  date: '2025-01-08T10:00:00Z', category: 'subscriptions',  description: 'Netflix + Spotify bundle',             splits: calcPercentage(1500, { [B]: 40, [A]: 25, [C]: 20, [D]: 15 }) },
    { paid_by: C, amount: 4200,  date: '2025-01-13T09:00:00Z', category: 'groceries',      description: 'Week 2 groceries – Swiggy Instamart',  splits: calcEqual(4200, all) },
    { paid_by: A, amount: 2000,  date: '2025-01-15T11:00:00Z', category: 'other',          description: 'Deep cleaning service – HomePlus',     splits: calcEqual(2000, all) },
    { paid_by: D, amount: 3900,  date: '2025-01-20T09:00:00Z', category: 'groceries',      description: 'Week 3 groceries (Chirag travelling)', splits: calcEqual(3900, all) },
    { paid_by: C, amount: 3800,  date: '2025-01-27T09:00:00Z', category: 'groceries',      description: 'Week 4 groceries – D-Mart run',        splits: calcEqual(3800, all) },
    { paid_by: A, amount: 48000, date: '2025-02-01T10:00:00Z', category: 'rent',           description: 'February rent – Indiranagar 2BHK',     splits: calcEqual(48000, all) },
    { paid_by: B, amount: 1200,  date: '2025-02-02T11:00:00Z', category: 'utilities',      description: 'ACT broadband – February',              splits: calcEqual(1200, all) },
    { paid_by: D, amount: 5200,  date: '2025-02-05T12:00:00Z', category: 'utilities',      description: 'February electricity bill',             splits: calcShares(5200, { [A]: 2, [B]: 1, [C]: 1, [D]: 1 }) },
    { paid_by: B, amount: 4000,  date: '2025-02-06T09:00:00Z', category: 'groceries',      description: 'Feb wk1 groceries (Chirag out of town)', splits: calcEqual(4000, all) },
    { paid_by: C, amount: 2500,  date: '2025-02-10T14:00:00Z', category: 'other',          description: 'Pest control (Aditya pays more – bigger room)', splits: calcUnequal({ [A]: 900, [B]: 600, [C]: 600, [D]: 400 }) },
    { paid_by: C, amount: 4100,  date: '2025-02-13T09:00:00Z', category: 'groceries',      description: 'Feb wk2 groceries – BigBasket',        splits: calcEqual(4100, all) },
  ]
}

// ─── Main seed handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the caller is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({
        error: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Seed only works in dev/staging.',
      }, { status: 503 })
    }

    // 2. Get or create demo users in auth + users table
    //    We upsert by email so re-running seed is idempotent.
    const memberIdMap: Record<string, string> = {}  // key → supabase user uuid

    for (const member of DEMO_MEMBERS) {
      // Check if demo user already exists in our users table
      const { data: existing } = await admin
        .from('users')
        .select('id')
        .eq('email', member.email)
        .single()

      if (existing) {
        memberIdMap[member.key] = existing.id
        continue
      }

      // Create auth user via admin API
      const { data: authUser, error: createError } = await admin.auth.admin.createUser({
        email: member.email,
        email_confirm: true,
        user_metadata: { name: member.name },
        password: 'demo-user-cannot-login-' + Math.random().toString(36).slice(2),
      })

      if (createError || !authUser.user) {
        // Try to find by email in auth (might already exist)
        const { data: authList } = await admin.auth.admin.listUsers()
        const found = authList?.users?.find((u) => u.email === member.email)
        if (found) {
          memberIdMap[member.key] = found.id
          // Ensure users row exists
          await admin.from('users').upsert({
            id: found.id,
            name: member.name,
            email: member.email,
            avatar_url: member.avatar_url,
          }, { onConflict: 'id' })
          continue
        }
        return NextResponse.json({
          error: `Failed to create demo user ${member.name}: ${createError?.message}`,
        }, { status: 500 })
      }

      memberIdMap[member.key] = authUser.user.id

      // Insert into users table
      const { error: userInsertError } = await admin.from('users').upsert({
        id: authUser.user.id,
        name: member.name,
        email: member.email,
        avatar_url: member.avatar_url,
      }, { onConflict: 'id' })

      if (userInsertError) {
        return NextResponse.json({
          error: `Failed to insert user record for ${member.name}: ${userInsertError.message}`,
        }, { status: 500 })
      }
    }

    // Also map the current real user into the first slot of each group
    // (current user replaces nobody — we add them as an extra admin)
    const realUserId = user.id

    // ── GROUP 1: Goa Trip 2025 ────────────────────────────────────────────────
    const { data: goaGroup, error: goaErr } = await admin
      .from('groups')
      .insert({
        name: "Goa Trip 2025 🏖️",
        emoji: '🏖️',
        created_by: realUserId,
      })
      .select()
      .single()

    if (goaErr || !goaGroup) {
      return NextResponse.json({ error: `Failed to create Goa group: ${goaErr?.message}` }, { status: 500 })
    }

    const goaMembers = ['arjun', 'priya', 'rohan', 'meera', 'dev']
    await admin.from('group_members').insert([
      { group_id: goaGroup.id, user_id: realUserId, role: 'admin' },
      ...goaMembers.map((key, i) => ({
        group_id: goaGroup.id,
        user_id: memberIdMap[key],
        role: i === 0 ? 'admin' : 'member',
      })),
    ])

    const goaIds = Object.fromEntries(goaMembers.map(k => [k, memberIdMap[k]]))
    const goaExpenses = buildGoaExpenses(goaIds)

    for (const exp of goaExpenses) {
      const { data: expRow, error: expErr } = await admin
        .from('expenses')
        .insert({
          group_id: goaGroup.id,
          paid_by: exp.paid_by,
          amount: exp.amount,
          description: exp.description,
          category: exp.category,
          created_at: exp.date,
        })
        .select()
        .single()

      if (expErr || !expRow) {
        return NextResponse.json({ error: `Failed to insert Goa expense: ${expErr?.message}` }, { status: 500 })
      }

      await admin.from('expense_splits').insert(
        exp.splits.map(s => ({
          expense_id: expRow.id,
          user_id: s.user_id,
          owed_amount: s.owed_amount,
        }))
      )
    }

    // ── GROUP 2: Raghav's Birthday Bash ──────────────────────────────────────
    const { data: birthdayGroup, error: bdErr } = await admin
      .from('groups')
      .insert({
        name: "Raghav's Birthday Bash 🎂",
        emoji: '🎂',
        created_by: realUserId,
      })
      .select()
      .single()

    if (bdErr || !birthdayGroup) {
      return NextResponse.json({ error: `Failed to create Birthday group: ${bdErr?.message}` }, { status: 500 })
    }

    const bdMembers = ['raghav', 'sanya', 'kiran', 'tanya', 'nikhil', 'zara']
    await admin.from('group_members').insert([
      { group_id: birthdayGroup.id, user_id: realUserId, role: 'admin' },
      ...bdMembers.map((key, i) => ({
        group_id: birthdayGroup.id,
        user_id: memberIdMap[key],
        role: i === 1 ? 'admin' : 'member',  // sanya is organiser
      })),
    ])

    const bdIds = Object.fromEntries(bdMembers.map(k => [k, memberIdMap[k]]))
    const bdExpenses = buildBirthdayExpenses(bdIds)

    for (const exp of bdExpenses) {
      const { data: expRow, error: expErr } = await admin
        .from('expenses')
        .insert({
          group_id: birthdayGroup.id,
          paid_by: exp.paid_by,
          amount: exp.amount,
          description: exp.description,
          category: exp.category,
          created_at: exp.date,
        })
        .select()
        .single()

      if (expErr || !expRow) {
        return NextResponse.json({ error: `Failed to insert Birthday expense: ${expErr?.message}` }, { status: 500 })
      }

      await admin.from('expense_splits').insert(
        exp.splits.map(s => ({
          expense_id: expRow.id,
          user_id: s.user_id,
          owed_amount: s.owed_amount,
        }))
      )
    }

    // ── GROUP 3: Bangalore Flatmates ──────────────────────────────────────────
    const { data: flatGroup, error: flatErr } = await admin
      .from('groups')
      .insert({
        name: "Bangalore Flatmates 🏠",
        emoji: '🏠',
        created_by: realUserId,
      })
      .select()
      .single()

    if (flatErr || !flatGroup) {
      return NextResponse.json({ error: `Failed to create Flatmates group: ${flatErr?.message}` }, { status: 500 })
    }

    const flatMembers = ['aditya', 'bhavna', 'chirag', 'divya']
    await admin.from('group_members').insert([
      { group_id: flatGroup.id, user_id: realUserId, role: 'admin' },
      ...flatMembers.map((key, i) => ({
        group_id: flatGroup.id,
        user_id: memberIdMap[key],
        role: i === 0 ? 'admin' : 'member',
      })),
    ])

    const flatIds = Object.fromEntries(flatMembers.map(k => [k, memberIdMap[k]]))
    const flatExpenses = buildFlatmatesExpenses(flatIds)

    for (const exp of flatExpenses) {
      const { data: expRow, error: expErr } = await admin
        .from('expenses')
        .insert({
          group_id: flatGroup.id,
          paid_by: exp.paid_by,
          amount: exp.amount,
          description: exp.description,
          category: exp.category,
          created_at: exp.date,
        })
        .select()
        .single()

      if (expErr || !expRow) {
        return NextResponse.json({ error: `Failed to insert Flatmates expense: ${expErr?.message}` }, { status: 500 })
      }

      await admin.from('expense_splits').insert(
        exp.splits.map(s => ({
          expense_id: expRow.id,
          user_id: s.user_id,
          owed_amount: s.owed_amount,
        }))
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully!',
      groups: [
        { id: goaGroup.id,       name: "Goa Trip 2025 🏖️",         expenses: goaExpenses.length },
        { id: birthdayGroup.id,  name: "Raghav's Birthday Bash 🎂", expenses: bdExpenses.length },
        { id: flatGroup.id,      name: "Bangalore Flatmates 🏠",     expenses: flatExpenses.length },
      ],
      demoUsers: Object.keys(memberIdMap).length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE: clean up seed data ───────────────────────────────────────────────

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 503 })
    }

    const seedGroupNames = ["Goa Trip 2025 🏖️", "Raghav's Birthday Bash 🎂", "Bangalore Flatmates 🏠"]

    // Find groups created by this user with seed names
    const { data: groups } = await admin
      .from('groups')
      .select('id')
      .eq('created_by', user.id)
      .in('name', seedGroupNames)

    if (groups && groups.length > 0) {
      const groupIds = groups.map((g: { id: string }) => g.id)
      // Cascade delete handles expenses + splits + members
      await admin.from('groups').delete().in('id', groupIds)
    }

    // Also clean up demo auth users if they have no other group memberships
    const demoEmails = DEMO_MEMBERS.map(m => m.email)
    const { data: demoUsers } = await admin
      .from('users')
      .select('id')
      .in('email', demoEmails)

    if (demoUsers && demoUsers.length > 0) {
      for (const u of demoUsers) {
        // Check if they're in any remaining groups
        const { data: memberships } = await admin
          .from('group_members')
          .select('id')
          .eq('user_id', u.id)
          .limit(1)

        if (!memberships || memberships.length === 0) {
          await admin.auth.admin.deleteUser(u.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${groups?.length ?? 0} seed group(s) and cleaned up demo users`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
