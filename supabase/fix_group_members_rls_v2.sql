-- Fix infinite recursion by using a SECURITY DEFINER function
-- This function bypasses RLS to check admin status

-- Drop the existing policy
DROP POLICY IF EXISTS "Group creators and admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;

-- Create a function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_group_admin(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_id_param
    AND group_members.user_id = user_id_param
    AND group_members.role = 'admin'
  );
END;
$$;

-- Create the new policy using the function
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
    -- Allow if user is already an admin (using function to avoid recursion)
    is_group_admin(group_members.group_id, auth.uid())
  );

