# Vercel Deployment Setup

This guide explains how to set up Vercel deployments for your project.

## Setup: Single Production Deployment

Since we're using a simplified workflow (test locally → merge to main), we only need one production deployment.

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository and click **"Import"**

### Step 2: Configure Production Branch

1. In your project settings, go to **Settings** → **Git**
2. Under **"Production Branch"**, select `main`
3. This makes `main` branch deployments go to your production domain

### Step 3: Enable Automatic Deployments

1. Go to **Settings** → **Git**
2. Enable **"Automatic deployments from Git"**
3. Enable **"Deploy previews for pull requests"** (optional but recommended for feature branches)

### Step 4: Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add all your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `ASSEMBLYAI_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - etc.
3. Select **"Production"** environment

### Step 5: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain: `splitkarobhai.com` or `app.splitkarobhai.com`

## Accessing Your Deployment

After setup, you'll have:

- **Production URL (main branch):**
  - `https://your-project.vercel.app`
  - Or your custom domain

- **Preview URLs (feature branches):**
  - `https://your-project-git-feature-branch-name-your-username.vercel.app`
  - Automatically created for each feature branch
  - Check Vercel dashboard → Deployments for exact URLs

## Workflow

1. **Create feature branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Develop and push:**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push -u origin feature/your-feature-name
   # Vercel automatically creates preview deployment
   ```

3. **Test locally:**
   ```bash
   npm run dev
   # Test all changes thoroughly
   ```

4. **Once approved, merge to main:**
   ```bash
   git checkout main
   git pull origin main
   git merge feature/your-feature-name --no-ff -m "Merge feature/your-feature-name: description"
   git push origin main
   # Vercel automatically deploys to production
   ```

## Troubleshooting

### Preview URLs not showing
- Check **Settings** → **Git** → **Deploy Previews** is enabled
- Ensure branch exists on GitHub

### Environment variables not working
- Check **Settings** → **Environment Variables**
- Ensure variables are set for correct environment (Production/Preview)
- Redeploy after adding variables

### Build failures
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Check `package.json` scripts are correct

### OAuth redirect issues
- Add your Vercel production URL to Supabase redirect URLs:
  - Go to Supabase Dashboard → Authentication → URL Configuration
  - Add: `https://your-project.vercel.app/auth/callback`
- For preview deployments, add preview URLs as needed:
  - `https://your-project-git-feature-branch-name-your-username.vercel.app/auth/callback`
