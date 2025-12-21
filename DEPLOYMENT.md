# Deployment Guide - SplitKaroBhai to Vercel

This guide will walk you through deploying SplitKaroBhai to Vercel and configuring all necessary services.

## Prerequisites

- GitHub repository with your code (already done ✅)
- Vercel account (sign up at https://vercel.com)
- Supabase project
- Google Cloud Console project with OAuth credentials

---

## Step 1: Deploy to Vercel

### 1.1 Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository (`hash-include-vansh/Splitwise`)
4. Vercel will auto-detect Next.js settings

### 1.2 Configure Build Settings

Vercel should auto-detect:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

### 1.3 Add Environment Variables

Before deploying, add these environment variables in Vercel:

**In Vercel Dashboard → Your Project → Settings → Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

**Important:** 
- Add these for **Production**, **Preview**, and **Development** environments
- Do NOT commit `.env.local` to GitHub (it's already in `.gitignore`)

---

## Step 2: Update Supabase Configuration

### 2.1 Update Site URL and Redirect URLs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**

**Update the following:**

- **Site URL:** 
  ```
  https://your-app-name.vercel.app
  ```
  (Replace `your-app-name` with your actual Vercel project name)

- **Redirect URLs:** Add these URLs (one per line):
  ```
  https://your-app-name.vercel.app/auth/callback
  https://your-app-name-git-dev-*.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```
  **Important:** 
  - Add the dev branch preview URL pattern (with wildcard `*`) to support dev deployments
  - The pattern `*-git-dev-*.vercel.app` covers all dev branch preview URLs
  - Keep localhost for local development

### 2.2 Verify RLS Status

Since you disabled RLS, make sure your application-layer authorization is working correctly. The deployment should work as-is since RLS is disabled.

---

## Step 3: Update Google OAuth Configuration

### 3.1 Update Authorized Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID (the one used for Supabase)

**Update Authorized redirect URIs:**

Add these URIs:
```
https://your-supabase-project-ref.supabase.co/auth/v1/callback
https://your-app-name.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**Note:** 
- The Supabase callback URL should already be there
- Add your Vercel production URL
- Keep localhost for development

### 3.2 Verify OAuth Consent Screen

Make sure your OAuth consent screen is configured:
- **Application name:** SplitKaroBhai (or your preferred name)
- **Authorized domains:** Add `vercel.app` if required
- **Scopes:** Should include email, profile, openid

---

## Step 4: Deploy and Test

### 4.1 Deploy

1. In Vercel, click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. Once deployed, you'll get a URL like: `https://your-app-name.vercel.app`

### 4.2 Test the Deployment

1. **Test Authentication:**
   - Visit your Vercel URL
   - Try logging in with Google
   - Verify redirect works correctly

2. **Test Voice Feature:**
   - Create a group
   - Try the voice expense feature
   - Verify Gemini API is working

3. **Test Core Features:**
   - Create groups
   - Add expenses
   - Check balances
   - Verify all features work

---

## Step 5: Custom Domain (Optional)

If you want a custom domain:

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. **Update Supabase Redirect URLs** to include your custom domain:
   ```
   https://your-custom-domain.com/auth/callback
   ```
5. **Update Google OAuth Redirect URIs** to include your custom domain

---

## Step 6: Environment-Specific Configuration

### Production Environment Variables

Make sure these are set in Vercel:

```bash
# Supabase (Public - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Gemini AI (Server-side only - not exposed to client)
GEMINI_API_KEY=your_gemini_api_key
```

### Important Notes:

- `NEXT_PUBLIC_*` variables are exposed to the browser
- `GEMINI_API_KEY` is server-side only (used in API routes)
- Never commit API keys to GitHub

---

## Troubleshooting

### Issue: OAuth redirect not working

**Solution:**
- Verify redirect URLs in Supabase match exactly (including `https://`)
- Check Google OAuth redirect URIs include your Vercel URL
- Clear browser cookies and try again

### Issue: Environment variables not working

**Solution:**
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are added for the correct environment (Production/Preview)

### Issue: Build fails

**Solution:**
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

### Issue: API routes return 500 errors

**Solution:**
- Check server logs in Vercel dashboard
- Verify `GEMINI_API_KEY` is set correctly
- Test API routes locally first

---

## Post-Deployment Checklist

- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Supabase Site URL updated
- [ ] Supabase Redirect URLs updated
- [ ] Google OAuth Redirect URIs updated
- [ ] Authentication working
- [ ] Voice feature working
- [ ] All core features tested
- [ ] Custom domain configured (if applicable)

---

## Quick Reference

### Vercel URLs
- Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs

### Supabase URLs
- Dashboard: https://app.supabase.com
- Documentation: https://supabase.com/docs

### Google Cloud Console
- Dashboard: https://console.cloud.google.com
- OAuth Setup: https://console.cloud.google.com/apis/credentials

---

## Need Help?

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for client-side errors
3. Check Vercel function logs for server-side errors
4. Verify all URLs and environment variables are correct

Good luck with your deployment! 🚀

