# Expense Splitter

A web application for splitting expenses among groups of users, inspired by Splitwise but without artificial limits.

## Features

- Google OAuth authentication
- Group creation and member management via invite links
- Expense creation with multiple split types (equal, unequal, percentage, share-based)
- Dynamic balance computation (raw and simplified debt)
- Unlimited expenses, groups, and users

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, React Query
- **Backend**: Supabase (Auth, PostgreSQL, RLS)
- **Hosting**: Vercel (frontend), Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase URL and anon key.
   
   **For Voice Commands (Mobile/iOS Support):**
   To enable voice commands on iPhone Chrome and other mobile browsers, add at least one speech-to-text API key:
   
   **Option 1: AssemblyAI (Recommended - Free Tier Available)**
   - Sign up at https://www.assemblyai.com/
   - Get your API key from the dashboard
   - Add to `.env.local`:
     ```
     ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
     ```
   
   **Option 2: Google Cloud Speech-to-Text**
   - Enable Speech-to-Text API in Google Cloud Console
   - Create credentials and get API key
   - Add to `.env.local`:
     ```
     GOOGLE_CLOUD_SPEECH_API_KEY=your_google_cloud_speech_api_key_here
     ```
     Note: You can also use your existing `GEMINI_API_KEY` if it has Speech-to-Text permissions.

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL scripts in `supabase/schema.sql` to create tables
   - Run the SQL scripts in `supabase/rls_policies.sql` to set up RLS policies
   - Configure Google OAuth in Supabase dashboard

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing

Run tests:
```bash
npm test
```

## Database Schema

The application uses the following tables:
- `users` - User profiles
- `groups` - Expense groups
- `group_members` - User-group relationships with roles
- `expenses` - Expense records
- `expense_splits` - Per-user split amounts
- `group_invites` - Invite tokens for group joining

See `documentation/DDS.md` for detailed schema documentation.

## Project Structure

```
/app              - Next.js app router pages
/components       - React components
/lib
  /services       - Business logic and API calls
  /utils          - Utility functions
  /types          - TypeScript type definitions
  /queries        - React Query setup
/hooks            - Custom React hooks
/supabase         - Database schema and migrations
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## License

MIT

