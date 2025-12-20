# Business Logic & Algorithms

## 1. Expense Split Processing

- Accept split configuration from UI.
- Normalize values based on split type.
- Validate that total equals expense amount.
- Persist expense and split records.

---

## 2. Balance Computation Logic

For each expense:
- The payer is credited with the full amount.
- Other users owe their respective split amounts.

Balances are aggregated per user pair.

---

## 3. Simplified Debt Algorithm

1. Calculate net balance for each user.
2. Separate users into:
   - Creditors (positive balance)
   - Debtors (negative balance)
3. Match debtors to creditors greedily.
4. Produce minimized set of transactions.

---

## 4. Core Constraint

- Balances are computed dynamically.
- No balance values are stored in the database.
