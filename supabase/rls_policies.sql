-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Groups table policies
CREATE POLICY "Users can read groups they belong to"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Group members table policies
CREATE POLICY "Users can read members of groups they belong to"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Group admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Expenses table policies
CREATE POLICY "Users can read expenses of groups they belong to"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
    )
    AND paid_by = auth.uid()
  );

-- Expense splits table policies
CREATE POLICY "Users can read splits for expenses in their groups"
  ON expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_splits.expense_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create splits"
  ON expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_splits.expense_id
      AND gm.user_id = auth.uid()
    )
  );

-- Group invites table policies
CREATE POLICY "Users can read invites for groups they belong to"
  ON group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can create invites"
  ON group_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

