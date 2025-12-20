# Fix: Missing Client Secret

## The Problem
Your Supabase Google provider settings show:
- ✅ Enable Sign in with Google: **ON**
- ✅ Client IDs: **Filled in**
- ❌ Client Secret (for OAuth): **EMPTY** ← This is causing the error

## The Solution

### Step 1: Get Client Secret from Google Cloud Console
1. Go to your Google Cloud Console
2. Navigate to the OAuth client you created
3. In the "Client secrets" section, you'll see:
   - Client secret: `****9r4y` (masked)
   - Next to it: Copy icon 📋
4. **Click the copy icon** to copy the full client secret

### Step 2: Paste into Supabase
1. Go to Supabase Dashboard
2. Authentication → Providers → Google
3. Find the field: **"Client Secret (for OAuth)"**
4. **Paste the client secret** you just copied
5. Click **Save** button at the bottom

### Step 3: Verify
After saving, the Client Secret field should show:
- Either the secret (if visible) or dots/masked
- But it should NOT be empty

### Step 4: Test
1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Should work now! ✅

## Important Notes
- The client secret is sensitive - never share it publicly
- If you can't see the secret in Google Cloud Console, you may need to create a new one
- The secret starts with `GOCSPX-` typically

