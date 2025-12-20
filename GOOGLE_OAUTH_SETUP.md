# Google OAuth Setup Guide

## Step 1: Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "Expense Splitter"
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue** through the steps
6. Back to creating OAuth client:
   - Application type: **Web application**
   - Name: "Expense Splitter Web"
   - **Authorized redirect URIs**: Add this exact URL:
     ```
     https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
     ```
     Replace `[YOUR_SUPABASE_PROJECT_REF]` with your Supabase project reference ID
     (You can find this in your Supabase project URL: `https://[PROJECT_REF].supabase.co`)
7. Click **Create**
8. **Copy the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle **Enable Google provider** to ON
5. Enter:
   - **Client ID (for OAuth)**: Paste the Client ID from Google Cloud Console
   - **Client Secret (for OAuth)**: Paste the Client Secret from Google Cloud Console
6. Click **Save**

## Step 3: Verify Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:
- Make sure **Site URL** is set to: `http://localhost:3000` (for development)
- The redirect URL should automatically be configured, but verify it matches:
  - `http://localhost:3000/auth/callback`

## Step 4: Test

1. Restart your Next.js dev server
2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. You should be redirected to Google's login page

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
- No trailing slashes, exact match required

### Error: "Invalid client"
- Double-check Client ID and Client Secret in Supabase
- Make sure Google OAuth is enabled in Supabase

### Error: "OAuth consent screen not configured"
- Complete the OAuth consent screen setup in Google Cloud Console
- Make sure you've added test users if your app is in testing mode

