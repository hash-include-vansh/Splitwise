# Fix: Dev Deployment Redirecting to Production

## Problem
After logging in on the dev deployment, you're being redirected to the production URL instead of staying on the dev deployment.

## Root Cause
Supabase OAuth redirect URLs are configured to only allow the production URL. When you log in on dev, Supabase redirects back to the production URL.

## Solution

### Step 1: Get Your Dev Deployment URL

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Deployments** tab
4. Find the deployment from the `dev` branch
5. Copy the deployment URL (it will look like: `https://your-project-git-dev-your-username.vercel.app`)

### Step 2: Update Supabase Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add your dev deployment URL:

   **Option A: Add Specific Dev URL**
   ```
   https://your-project-git-dev-your-username.vercel.app/auth/callback
   ```
   (Replace with your actual dev deployment URL)

   **Option B: Use Wildcard Pattern (Recommended)**
   ```
   https://your-project-name-git-dev-*.vercel.app/auth/callback
   ```
   (This covers all dev branch preview URLs automatically)

5. Your complete **Redirect URLs** list should look like:
   ```
   https://your-project-name.vercel.app/auth/callback
   https://your-project-name-git-dev-*.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

6. Click **Save**

### Step 3: Update Google OAuth Redirect URIs (If Needed)

If you're still having issues, also update Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://your-project-git-dev-*.vercel.app/auth/callback
   ```
   Or the specific dev URL:
   ```
   https://your-project-git-dev-your-username.vercel.app/auth/callback
   ```
5. Click **Save**

### Step 4: Test

1. Clear your browser cookies for the dev deployment
2. Visit your dev deployment URL
3. Try logging in
4. You should now stay on the dev deployment after login

## Quick Fix Summary

**In Supabase Dashboard → Authentication → URL Configuration:**

Add this to **Redirect URLs**:
```
https://your-project-name-git-dev-*.vercel.app/auth/callback
```

This wildcard pattern will match all dev branch preview URLs automatically.

## Troubleshooting

### Still redirecting to production?

1. **Clear browser cookies** for both production and dev URLs
2. **Check the exact dev URL** in Vercel dashboard (it might be slightly different)
3. **Verify the redirect URL pattern** matches your actual dev URL format
4. **Wait a few minutes** after saving - Supabase changes can take a moment to propagate

### Dev URL format

Vercel preview URLs follow this pattern:
- `https://[project-name]-git-[branch-name]-[username].vercel.app`
- For dev branch: `https://[project-name]-git-dev-[username].vercel.app`

The wildcard pattern `*-git-dev-*.vercel.app` should match all variations.

