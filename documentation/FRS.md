# Functional Requirements Specification (FRS)

## 1. Authentication & Authorization

### Requirements
- Users must authenticate using Google OAuth.
- Authentication will be handled using Supabase Auth.
- Sessions must persist across page reloads.
- Unauthenticated users must not access protected routes.

### User Flow
1. User clicks "Sign in with Google".
2. OAuth authentication completes.
3. User record is created or updated in the database.
4. User is redirected to the dashboard.

---

## 2. User Management

- A user record must be created on first login.
- User profile includes:
  - Name
  - Email
  - Avatar URL
- Users cannot modify or delete other users.

---

## 3. Group Management

### Create Group
- Any authenticated user can create a group.
- Group creator is assigned the `admin` role.

### Invite Members
- Users can invite others using:
  - Shareable invite links
- Invited users must authenticate before joining.

### Group Roles
- **Admin**
  - Invite/remove members
- **Member**
  - Add expenses
  - View balances

---

## 4. Expense Management

### Add Expense
Each expense must include:
- Description
- Total amount
- Paid-by user
- Group ID
- Split configuration

### Supported Split Types
- Equal split
- Unequal (exact amount per user)
- Percentage-based split
- Share-based split
- Exclusion of selected members

### Validation Rules
- Total of all splits must equal the expense amount.
- Paid-by user must belong to the group.
- Only group members can be included in splits.

---

## 5. Balance & Debt Calculation

### Raw Balances
- Track how much each user owes every other user within a group.

### Simplified Balances (Optional)
- Optional toggle to minimize transactions.
- Uses net balance simplification logic.
