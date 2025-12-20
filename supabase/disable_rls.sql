-- Disable RLS on all tables - handle authorization in application code instead

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can read groups they belong to" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can read members of groups they belong to" ON group_members;
DROP POLICY IF EXISTS "Group creators and admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can read expenses of groups they belong to" ON expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can read splits for expenses in their groups" ON expense_splits;
DROP POLICY IF EXISTS "Group members can create splits" ON expense_splits;
DROP POLICY IF EXISTS "Users can read invites for groups they belong to" ON group_invites;
DROP POLICY IF EXISTS "Group admins can create invites" ON group_invites;

-- Drop any functions we created
DROP FUNCTION IF EXISTS public.is_group_admin_or_creator(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_group_admin(UUID, UUID);

