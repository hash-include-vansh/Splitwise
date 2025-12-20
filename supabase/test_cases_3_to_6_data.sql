-- Test Cases 3, 4, 5, and 6: Create all remaining test cases as separate groups
-- Users:
-- Vansh: 9a5a2f2c-9df0-4012-a3d3-977bf5a70777
-- Shabnam: 4841e96e-ff62-4c36-bfb0-3cb32b96fdf9
-- Global Gully: 0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6

DO $$
DECLARE
  v_group3_id UUID;
  v_group4_id UUID;
  v_group5_id UUID;
  v_group6_id UUID;
  v_expense_id UUID;
BEGIN
  -- ============================================
  -- TEST CASE 3: Mixed Split Types
  -- ============================================
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 3',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id INTO v_group3_id;

  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES
    (v_group3_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin', NOW()),
    (v_group3_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member', NOW()),
    (v_group3_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member', NOW());

  -- Expense 1: Restaurant (Equal) - Vansh paid ₹300
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group3_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    300.00,
    'Restaurant',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 100.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 100.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 100.00);

  -- Expense 2: Movie Tickets (Unequal) - Shabnam paid ₹450
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group3_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    450.00,
    'Movie Tickets',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 200.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 150.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 100.00);

  -- Expense 3: Groceries (Percentage) - Global Gully paid ₹600
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group3_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    600.00,
    'Groceries',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 300.00), -- 50%
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 180.00), -- 30%
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 120.00); -- 20%

  -- Expense 4: Taxi (Shares, Global excluded) - Vansh paid ₹150
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group3_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    150.00,
    'Taxi',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 100.00), -- 2 shares
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 50.00);  -- 1 share
  -- Global excluded (no split entry)

  -- ============================================
  -- TEST CASE 4: One Person Pays Everything
  -- ============================================
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 4',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id INTO v_group4_id;

  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES
    (v_group4_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin', NOW()),
    (v_group4_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member', NOW()),
    (v_group4_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member', NOW());

  -- Expense 1: Dinner - Vansh paid ₹300
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group4_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    300.00,
    'Dinner',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 100.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 100.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 100.00);

  -- Expense 2: Movie - Vansh paid ₹600
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group4_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    600.00,
    'Movie',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 200.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 200.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 200.00);

  -- Expense 3: Groceries - Vansh paid ₹900
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group4_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    900.00,
    'Groceries',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 300.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 300.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 300.00);

  -- ============================================
  -- TEST CASE 5: Complex with Rounding
  -- ============================================
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 5',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id INTO v_group5_id;

  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES
    (v_group5_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin', NOW()),
    (v_group5_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member', NOW()),
    (v_group5_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member', NOW());

  -- Expense 1: Coffee (Equal) - Vansh paid ₹100
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group5_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    100.00,
    'Coffee',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 33.33),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 33.33),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 33.34);

  -- Expense 2: Lunch (Percentage) - Shabnam paid ₹333.33
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group5_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    333.33,
    'Lunch',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 133.33), -- 40%
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 116.67), -- 35%
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 83.33);  -- 25%

  -- Expense 3: Shopping (Shares) - Global Gully paid ₹250
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group5_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    250.00,
    'Shopping',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 125.00), -- 3 shares
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 83.33),  -- 2 shares
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 41.67);  -- 1 share

  -- Expense 4: Uber (Unequal, Global excluded) - Vansh paid ₹75
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group5_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    75.00,
    'Uber',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 25.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 50.00);
  -- Global excluded (no split entry)

  -- Expense 5: Dinner (Equal) - Shabnam paid ₹200
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group5_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    200.00,
    'Dinner',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 66.67),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 66.67),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 66.66);

  -- ============================================
  -- TEST CASE 6: All Settled Up
  -- ============================================
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 6',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id INTO v_group6_id;

  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES
    (v_group6_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin', NOW()),
    (v_group6_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member', NOW()),
    (v_group6_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member', NOW());

  -- Expense 1: Dinner - Vansh paid ₹300
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group6_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    300.00,
    'Dinner',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 100.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 100.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 100.00);

  -- Expense 2: Movie - Shabnam paid ₹300
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group6_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    300.00,
    'Movie',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 100.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 100.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 100.00);

  -- Expense 3: Groceries - Global Gully paid ₹300
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group6_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    300.00,
    'Groceries',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 100.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 100.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 100.00);

  RAISE NOTICE 'Test Cases 3, 4, 5, and 6 created successfully!';
  RAISE NOTICE 'Test Case 3 Group ID: %', v_group3_id;
  RAISE NOTICE 'Test Case 4 Group ID: %', v_group4_id;
  RAISE NOTICE 'Test Case 5 Group ID: %', v_group5_id;
  RAISE NOTICE 'Test Case 6 Group ID: %', v_group6_id;
END $$;

