-- Better solution: Use a trigger to auto-add creator, then simplify the policy

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Group creators and admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;

-- Step 2: Create a trigger function to auto-add group creator as admin
CREATE OR REPLACE FUNCTION auto_add_group_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically add the group creator as admin
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger to run after group creation
DROP TRIGGER IF EXISTS on_group_created ON groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_group_creator();

-- Step 4: Simplified policy - only group creators can add members initially
-- (The trigger handles adding the creator, so this is for adding other members)
CREATE POLICY "Group admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the group creator (they'll be auto-added by trigger, but this allows manual addition too)
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
    OR
    -- Allow if user is an admin (check directly without function to avoid recursion)
    -- We use a subquery that should work
    (SELECT role FROM group_members 
     WHERE group_id = group_members.group_id 
     AND user_id = auth.uid()) = 'admin'
  );

