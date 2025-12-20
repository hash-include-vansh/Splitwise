-- Final fix: Use SECURITY DEFINER function to bypass RLS recursion

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Group creators and admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;

-- Step 2: Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_group_admin_or_creator(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_creator BOOLEAN;
  is_admin BOOLEAN;
BEGIN
  -- Check if user is the group creator
  SELECT EXISTS (
    SELECT 1 FROM groups
    WHERE id = p_group_id
    AND created_by = p_user_id
  ) INTO is_creator;
  
  IF is_creator THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is an admin (this query bypasses RLS due to SECURITY DEFINER)
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'admin'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Step 3: Create the policy using the function
CREATE POLICY "Group creators and admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    public.is_group_admin_or_creator(group_members.group_id, auth.uid())
  );

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_group_admin_or_creator(UUID, UUID) TO authenticated;

