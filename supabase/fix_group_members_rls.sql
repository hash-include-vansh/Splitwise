-- Fix infinite recursion in group_members RLS policy
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;

-- Create a new policy that allows:
-- 1. Group creator to add themselves as the first member
-- 2. Existing group admins to add other members
CREATE POLICY "Group creators and admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the group creator (for first member)
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
    OR
    -- Allow if user is already an admin in the group
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

