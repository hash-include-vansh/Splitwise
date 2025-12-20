# Troubleshooting Google OAuth Error

## Error: "Unsupported provider: missing OAuth secret"

This error means Google OAuth is not properly configured in your Supabase project.

## Step-by-Step Fix

### 1. Verify Supabase Configuration

Go to your Supabase Dashboard:
1. Navigate to: **Authentication** → **Providers**
2. Find **Google** in the list
3. Check if it shows:
   - ❌ **Disabled** or **Not configured**
   - ✅ Should show: **Enabled** with green checkmark

### 2. Enable Google Provider

If Google is disabled:
1. Click on **Google** provider
2. Toggle **Enable Google provider** to **ON**
3. You'll see two fields:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**

### 3. Get Google OAuth Credentials

If you don't have credentials yet:

#### A. Go to Google Cloud Console
- URL: https://console.cloud.google.com/
- Select your project (or create one)

#### B. Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable** (if not already enabled)

#### C. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - Choose **External**
   - App name: "Expense Splitter"
   - User support email: Your email
   - Developer contact: Your email
   - Click through the steps and **Save**

4. Back to creating OAuth client:
   - Application type: **Web application**
   - Name: "Expense Splitter"
   - **Authorized redirect URIs**: Add this EXACT URL:
     ```
     https://odnbyzpwmezzwfldqynw.supabase.co/auth/v1/callback
     ```
     (This is your Supabase project URL + `/auth/v1/callback`)
   - Click **Create**

5. **IMPORTANT**: Copy both:
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxxxxxxxxxx`)

### 4. Add Credentials to Supabase

Back in Supabase Dashboard:
1. **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID** → into "Client ID (for OAuth)" field
   - **Client Secret** → into "Client Secret (for OAuth)" field
3. Click **Save**

### 5. Verify Configuration

After saving, you should see:
- ✅ Google provider is **Enabled**
- ✅ Both Client ID and Secret are filled in

### 6. Test Again

1. Restart your dev server (if needed)
2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Should redirect to Google login page

## Common Issues

### Issue: "redirect_uri_mismatch" in Google
**Fix**: Make sure the redirect URI in Google Cloud Console is EXACTLY:
```
https://odnbyzpwmezzwfldqynw.supabase.co/auth/v1/callback
```
- No `http://` (must be `https://`)
- No trailing slash
- Must end with `/auth/v1/callback`

### Issue: Still getting "missing OAuth secret"
**Check**:
1. Did you click **Save** in Supabase after entering credentials?
2. Are both Client ID and Secret filled in (not empty)?
3. Try refreshing the Supabase dashboard page
4. Wait 30 seconds after saving, then try again

### Issue: OAuth consent screen error
**Fix**: Complete the OAuth consent screen setup in Google Cloud Console first

## Quick Verification Checklist

- [ ] Google Cloud Console: OAuth client created
- [ ] Google Cloud Console: Redirect URI added: `https://odnbyzpwmezzwfldqynw.supabase.co/auth/v1/callback`
- [ ] Google Cloud Console: Client ID and Secret copied
- [ ] Supabase: Authentication → Providers → Google
- [ ] Supabase: Google provider **Enabled** (toggle ON)
- [ ] Supabase: Client ID pasted
- [ ] Supabase: Client Secret pasted
- [ ] Supabase: **Save** button clicked
- [ ] Dev server restarted

## Still Not Working?

If you've completed all steps and still get the error:
1. Take a screenshot of your Supabase Google provider settings (hide secrets)
2. Check browser console for any additional error messages
3. Try clearing browser cache and cookies
4. Try in an incognito/private window

