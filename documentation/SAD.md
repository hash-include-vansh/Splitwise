# System Architecture Document (SAD)

## 1. Overview

This document describes the high-level architecture, technology stack, security model, and scalability considerations for the Expense Splitter web application.

---

## 2. High-Level Architecture

The system follows a client–backend–database architecture.

Architecture flow:

Client (Next.js Web App)  
→ Supabase Backend Services  
→ PostgreSQL Database

---

## 3. Technology Stack

### 3.1 Frontend
- Framework: Next.js (React)
- Styling: Tailwind CSS
- Server State Management: React Query
- Client State Management: React hooks

### 3.2 Backend
- Platform: Supabase
  - Authentication: Google OAuth
  - Database: PostgreSQL
  - Authorization: Row Level Security (RLS)

### 3.3 Hosting & Deployment
- Frontend Hosting: Vercel
- Backend & Database Hosting: Supabase
- Environment Configuration:
  - Frontend secrets via Vercel
  - Backend secrets via Supabase

---

## 4. Authentication Architecture

- Google OAuth is used for user authentication.
- Supabase Auth manages:
  - OAuth handshake
  - Session tokens
  - User identity
- Each authenticated user has a unique UUID.

---

## 5. Authorization & Security Model

Authorization is enforced using Supabase Row Level Security (RLS).

### Security Rules
- Users can only read groups they belong to.
- Users can only read expenses belonging to their groups.
- Only group members can create expenses.
- Only group admins can invite or remove members.

---

## 6. Data Flow

1. User authenticates via Google OAuth.
2. Frontend receives authenticated session.
3. Frontend makes authorized requests to Supabase.
4. Supabase enforces RLS policies.
5. PostgreSQL persists data.

---

## 7. Scalability Considerations

- Stateless frontend architecture
- No balance data stored (computed dynamically)
- Relational schema optimized with indexes
- Ready for:
  - Realtime updates
  - Notifications
  - Mobile clients

---

## 8. Future Extensibility

- Payment integrations
- Notifications
- Multi-currency support
- Mobile applications
