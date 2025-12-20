-- Test Case 2: Circular Debt Chain
-- Run this in Supabase SQL Editor
-- This version uses a simpler approach with a CTE to get the group_id

WITH new_group AS (
  INSERT INTO groups (id, name, created_by, created_at)
  VALUES (
    uuid_generate_v4(),
    'Test Case 2',
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    NOW()
  )
  RETURNING id
),
group_members_insert AS (
  INSERT INTO group_members (group_id, user_id, role, joined_at)
  SELECT 
    ng.id,
    user_data.user_id,
    user_data.role,
    NOW()
  FROM new_group ng
  CROSS JOIN (
    VALUES
      ('9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 'admin'),
      ('4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 'member'),
      ('0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 'member')
  ) AS user_data(user_id, role)
  RETURNING group_id
),
expense1 AS (
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  SELECT 
    uuid_generate_v4(),
    ng.id,
    '9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid,
    900.00,
    'Dinner',
    NOW()
  FROM new_group ng
  RETURNING id
),
expense1_splits AS (
  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  SELECT 
    e1.id,
    split_data.user_id,
    split_data.owed_amount
  FROM expense1 e1
  CROSS JOIN (
    VALUES
      ('9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 300.00),
      ('4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 300.00),
      ('0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 300.00)
  ) AS split_data(user_id, owed_amount)
),
expense2 AS (
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  SELECT 
    uuid_generate_v4(),
    ng.id,
    '4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid,
    1200.00,
    'Groceries',
    NOW()
  FROM new_group ng
  RETURNING id
),
expense2_splits AS (
  INSERT INTO expense_splits (expense_id, user_id, owed_amount)
  SELECT 
    e2.id,
    split_data.user_id,
    split_data.owed_amount
  FROM expense2 e2
  CROSS JOIN (
    VALUES
      ('9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 400.00),
      ('4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 400.00),
      ('0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 400.00)
  ) AS split_data(user_id, owed_amount)
),
expense3 AS (
  INSERT INTO expenses (id, group_id, paid_by, amount, description, created_at)
  SELECT 
    uuid_generate_v4(),
    ng.id,
    '0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid,
    1500.00,
    'Shopping',
    NOW()
  FROM new_group ng
  RETURNING id
)
INSERT INTO expense_splits (expense_id, user_id, owed_amount)
SELECT 
  e3.id,
  split_data.user_id,
  split_data.owed_amount
FROM expense3 e3
CROSS JOIN (
  VALUES
    ('9a5a2f2c-9df0-4012-a3d3-977bf5a70777'::uuid, 500.00),
    ('4841e96e-ff62-4c36-bfb0-3cb32b96fdf9'::uuid, 500.00),
    ('0ef2ae27-d8c4-43fe-bb22-7800bf37fcf6'::uuid, 500.00)
) AS split_data(user_id, owed_amount);

