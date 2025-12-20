-- Test Case 2: Circular Debt Chain
-- Users:
-- Vansh: 9a5a2f2c-9df0-4012-a3d3-977bf5a70777
-- Shabnam: 4841e96e-ff62-4c36-bfb0-3cb32b96fdf9
-- Global Gully: 0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6

-- Step 1: Create the group "Test Case 2"
INSERT INTO groups (id, name, created_by, created_at)
VALUES (
  uuid_generate_v4(),
  'Test Case 2',
  '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
  NOW()
)
RETURNING id;

-- Step 2: Add group members (store the group_id from above)
-- Assuming the group_id is returned, replace 'GROUP_ID_HERE' with the actual UUID
-- For now, we'll use a variable approach - you'll need to run this in sequence

-- First, let's create a temporary variable to store the group_id
DO $$
DECLARE
  v_group_id UUID;
  v_expense1_id UUID;
  v_expense2_id UUID;
  v_expense3_id UUID;
BEGIN
  -- Create group
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 2',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id INTO v_group_id;

  -- Add group members
  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES
    (v_group_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin', NOW()),
    (v_group_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member', NOW()),
    (v_group_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member', NOW());

  -- Expense 1: Dinner - Vansh paid ₹900, split equally (₹300 each)
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    900.00,
    'Dinner',
    NOW()
  )
  RETURNING id INTO v_expense1_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense1_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 300.00),
    (v_expense1_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 300.00),
    (v_expense1_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 300.00);

  -- Expense 2: Groceries - Shabnam paid ₹1200, split equally (₹400 each)
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    1200.00,
    'Groceries',
    NOW()
  )
  RETURNING id INTO v_expense2_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense2_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 400.00),
    (v_expense2_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 400.00),
    (v_expense2_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 400.00);

  -- Expense 3: Shopping - Global Gully paid ₹1500, split equally (₹500 each)
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    1500.00,
    'Shopping',
    NOW()
  )
  RETURNING id INTO v_expense3_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense3_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 500.00),
    (v_expense3_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 500.00),
    (v_expense3_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 500.00);

  RAISE NOTICE 'Test Case 2 data inserted successfully. Group ID: %', v_group_id;
END $$;

