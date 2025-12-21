# Vercel Branch Deployment Setup

This guide explains how to set up separate Vercel deployments for `main` (production) and `dev` (staging) branches.

## Option 1: Automatic Branch Deployments (Recommended)

Vercel automatically creates preview deployments for all branches. You can configure which branch is production.

### Step 1: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Select the repository and click **"Import"**

### Step 2: Configure Production Branch

1. In your project settings, go to **Settings** → **Git**
2. Under **"Production Branch"**, select `main`
3. This makes `main` branch deployments go to your production domain

### Step 3: Enable Branch Deployments

1. Go to **Settings** → **Git**
2. Enable **"Automatic deployments from Git"**
3. Enable **"Deploy previews for pull requests"** (optional but recommended)

### Step 4: Access Your Deployments

- **Production (main branch):**
  - URL: `your-project-name.vercel.app`
  - Custom domain: `yourdomain.com` (if configured)
  - Auto-deploys on every push to `main`

- **Preview (dev branch):**
  - URL: `your-project-name-git-dev-your-username.vercel.app`
  - Or check Vercel dashboard for the exact URL
  - Auto-deploys on every push to `dev`

## Option 2: Separate Projects (More Control)

Create two separate Vercel projects for better isolation.

### Step 1: Create Production Project

1. Go to Vercel Dashboard
2. Click **"Add New..."** → **"Project"**
3. Import repository
4. **Project Name:** `splitkarobhai` (or your preferred name)
5. **Framework Preset:** Next.js
6. **Root Directory:** `./` (leave as is)
7. **Build Command:** `npm run build` (auto-detected)
8. **Output Directory:** `.next` (auto-detected)
9. **Install Command:** `npm install` (auto-detected)
10. Under **"Git"** settings:
    - **Production Branch:** `main`
    - **Branch Deployments:** Disable (optional)
11. Click **"Deploy"**

### Step 2: Create Development Project

1. Go to Vercel Dashboard
2. Click **"Add New..."** → **"Project"**
3. Import the **same** repository
4. **Project Name:** `splitkarobhai-dev` (or `splitkarobhai-staging`)
5. **Framework Preset:** Next.js
6. **Root Directory:** `./`
7. **Build Command:** `npm run build`
8. **Output Directory:** `.next`
9. **Install Command:** `npm install`
10. Under **"Git"** settings:
    - **Production Branch:** `dev`
    - **Branch Deployments:** Disable (optional)
11. Click **"Deploy"**

### Step 3: Configure Environment Variables

For each project, set up environment variables:

**Production Project (main):**
- Go to **Settings** → **Environment Variables**
- Add all your production environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`
  - `ASSEMBLYAI_API_KEY`
  - etc.
- Select **"Production"** environment

**Development Project (dev):**
- Go to **Settings** → **Environment Variables**
- Add the same variables (or different ones for testing)
- Select **"Production"** environment (since `dev` is the production branch for this project)

### Step 4: Configure Custom Domains (Optional)

**Production:**
- Go to **Settings** → **Domains**
- Add your production domain: `splitkarobhai.com` or `app.splitkarobhai.com`

**Development:**
- Go to **Settings** → **Domains**
- Add a staging domain: `dev.splitkarobhai.com` or `staging.splitkarobhai.com`

## Option 3: Using Vercel CLI (Advanced)

You can also link projects via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link production project
vercel link
# Select your production project

# Deploy to production
vercel --prod

# Link development project
vercel link
# Select your development project (or create new)

# Deploy to development
vercel
```

## Recommended Setup

**I recommend Option 1 (Automatic Branch Deployments)** because:
- ✅ Simpler setup
- ✅ Automatic deployments
- ✅ Preview URLs for every branch
- ✅ Easy to manage
- ✅ Free tier supports this

**Use Option 2 (Separate Projects)** if you need:
- Different environment variables per environment
- Different build settings
- Complete isolation between environments
- Different custom domains

## Accessing Your Deployments

After setup, you'll have:

1. **Production URL (main branch):**
   - `https://your-project.vercel.app`
   - Or your custom domain

2. **Development URL (dev branch):**
   - `https://your-project-git-dev-your-username.vercel.app`
   - Or check Vercel dashboard → Deployments

## Workflow

1. **Develop on `dev` branch:**
   ```bash
   git checkout dev
   git push origin dev
   # Vercel automatically deploys to dev URL
   ```

2. **Test on dev deployment**

3. **Merge to `main` when ready:**
   ```bash
   git checkout main
   git merge dev --no-ff
   git push origin main
   # Vercel automatically deploys to production URL
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

