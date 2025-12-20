# Database Design Specification (DDS)

## 1. Overview

This document defines the database schema for the Expense Splitter application.  
The database is relational and implemented using PostgreSQL (via Supabase).

---

## 2. Users Table

Table Name: users

Columns:
- id (UUID, primary key)
- name (text)
- email (text, unique)
- avatar_url (text)
- created_at (timestamp)

Purpose:
- Stores application-level user metadata.
- Linked to Supabase Auth users.

---

## 3. Groups Table

Table Name: groups

Columns:
- id (UUID, primary key)
- name (text)
- created_by (UUID, foreign key → users.id)
- created_at (timestamp)

Purpose:
- Represents an expense-sharing group.

---

## 4. Group Members Table

Table Name: group_members

Columns:
- id (UUID, primary key)
- group_id (UUID, foreign key → groups.id)
- user_id (UUID, foreign key → users.id)
- role (text: admin | member)
- joined_at (timestamp)

Constraints:
- Unique constraint on (group_id, user_id)

Purpose:
- Maps users to groups with roles.

---

## 5. Expenses Table

Table Name: expenses

Columns:
- id (UUID, primary key)
- group_id (UUID, foreign key → groups.id)
- paid_by (UUID, foreign key → users.id)
- amount (numeric)
- description (text)
- simplified (boolean)
- created_at (timestamp)

Purpose:
- Stores expense metadata per group.

---

## 6. Expense Splits Table

Table Name: expense_splits

Columns:
- id (UUID, primary key)
- expense_id (UUID, foreign key → expenses.id)
- user_id (UUID, foreign key → users.id)
- owed_amount (numeric)

Constraints:
- Sum of owed_amount per expense must equal expense.amount

Purpose:
- Stores per-user liability for each expense.

---

## 7. Group Invites Table

Table Name: group_invites

Columns:
- id (UUID, primary key)
- group_id (UUID, foreign key → groups.id)
- invite_token (text, unique)
- expires_at (timestamp)

Purpose:
- Enables invite-based group joining via links.

---

## 8. Derived Data (Not Stored)

The following are computed dynamically and not persisted:
- User balances
- Simplified debts
- Net payable/receivable amounts

Rationale:
- Prevents data inconsistency
- Simplifies updates and corrections
