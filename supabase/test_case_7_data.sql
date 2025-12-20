-- Test Case 7: Complex Travel Expenses with Multiple Split Types and Exclusions
-- Users:
-- Vansh: 9a5a2f2c-9df0-4012-a3d3-977bf5a70777
-- Shabnam: 4841e96e-ff62-4c36-bfb0-3cb32b96fdf9
-- Global Gully: 0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6

DO $$
DECLARE
  v_group7_id UUID;
  v_expense_id UUID;
BEGIN
  -- Create Test Case 7 group
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 7',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id INTO v_group7_id;

  INSERT INTO group_members (group_id, user_id, role, joined_at)
  VALUES
    (v_group7_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin', NOW()),
    (v_group7_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member', NOW()),
    (v_group7_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member', NOW());

  -- Expense 1: Airport Cab (Equal) - Vansh paid ₹480
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    480.00,
    'Airport Cab',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 160.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 160.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 160.00);

  -- Expense 2: Breakfast (Unequal) - Shabnam paid ₹275
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    275.00,
    'Breakfast',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 125.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 75.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 75.00);

  -- Expense 3: Flight Tickets (Percentage) - Global Gully paid ₹7,999
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    7999.00,
    'Flight Tickets',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 2959.63), -- 37%
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 2639.67), -- 33%
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 2399.70); -- 30%

  -- Expense 4: Hotel Stay (Shares) - Vansh paid ₹6,500
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    6500.00,
    'Hotel Stay',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 2785.71), -- 3 shares
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 1857.14), -- 2 shares
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 1857.15); -- 2 shares

  -- Expense 5: Local Transport (Equal, Global excluded) - Shabnam paid ₹420
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    420.00,
    'Local Transport',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 210.00),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 210.00);
  -- Global excluded (no split entry)

  -- Expense 6: Lunch (Percentage) - Vansh paid ₹1,245
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    1245.00,
    'Lunch',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 348.60), -- 28%
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 572.70), -- 46%
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 323.70); -- 26%

  -- Expense 7: Museum Tickets (Unequal, Vansh excluded) - Global Gully paid ₹390
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    390.00,
    'Museum Tickets',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 195.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 195.00);
  -- Vansh excluded (no split entry)

  -- Expense 8: Shopping (Shares) - Shabnam paid ₹3,333
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    3333.00,
    'Shopping',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 2083.13), -- 5 shares
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 833.25),  -- 2 shares
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 416.62);  -- 1 share

  -- Expense 9: Coffee (Equal, rounding) - Vansh paid ₹101
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    101.00,
    'Coffee',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 33.67),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 33.67),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 33.66);

  -- Expense 10: Late-Night Snacks (Unequal, fractional) - Global Gully paid ₹589
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    589.00,
    'Late-Night Snacks',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 199.50),
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 189.50),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 200.00);

  -- Expense 11: Emergency Pharmacy (Equal, Shabnam excluded) - Vansh paid ₹260
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    260.00,
    'Emergency Pharmacy',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 130.00),
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 130.00);
  -- Shabnam excluded (no split entry)

  -- Expense 12: Dinner (Percentage, rounding-heavy) - Shabnam paid ₹2,499
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  VALUES (
    uuid_generate_v4(),
    v_group7_id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    2499.00,
    'Dinner',
    NOW()
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  VALUES
    (v_expense_id, '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 1024.59), -- 41%
    (v_expense_id, '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 849.66),   -- 34%
    (v_expense_id, '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 624.75);  -- 25%

  RAISE NOTICE 'Test Case 7 created successfully! Group ID: %', v_group7_id;
END $$;

