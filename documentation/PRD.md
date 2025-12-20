# Product Requirements Document (PRD)

## 1. Product Overview

**Product Name**: Expense Splitter (Splitwise-like MVP)  
**Product Type**: Web Application  
**Objective**:  
Build a minimal, unrestricted expense-splitting web application inspired by Splitwise, without artificial limits on the number of expenses, groups, or users.

---

## 2. Problem Statement

Most expense-splitting applications impose restrictions on free users, such as limits on the number of expenses or access to advanced features. This product aims to provide a clean, minimal, and unrestricted alternative focused on core expense management functionality.

---

## 3. Target Users

- Friends sharing daily expenses
- Roommates managing household costs
- Travel groups tracking trip expenses
- Small informal groups requiring transparent balance tracking

---

## 4. MVP Scope

### Included
- Google OAuth-based authentication
- Group creation and member management
- Expense creation within groups
- Multiple expense split types
- Optional simplified debt calculation
- Unlimited expenses and groups

### Excluded (MVP)
- Payment integrations (UPI, cards, banks)
- Notifications (email or push)
- File attachments or receipts
- Multi-currency support
- Offline mode

---

## 5. Goals & Success Metrics

- Users can log in using Google without friction
- Users can create groups and add members successfully
- Expense splits are calculated accurately
- Simplified debt toggle produces deterministic results
- No artificial usage limits exist

---

## 6. Non-Functional Requirements

- Secure authentication and authorization
- Data isolation between users and groups
- Responsive web UI
- Scalable database schema
- Fast balance computations
