# Git Branch Workflow

## Branch Structure

- **`main`** - Stable/Production branch
  - Only contains tested and approved code
  - Always deployable
  - Protected branch (should be protected in GitHub settings)

- **`dev`** - Development branch
  - Active development happens here
  - New features are merged into `dev` first
  - Testing happens on `dev` branch

## Workflow

### For New Features:

1. **Create feature branch from `dev`:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Develop and commit:**
   ```bash
   git add .
   git commit -m "Add feature: your feature description"
   ```

3. **Push feature branch:**
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. **Merge feature into `dev`:**
   ```bash
   git checkout dev
   git merge feature/your-feature-name --no-ff -m "Merge feature/your-feature-name into dev"
   git push origin dev
   git branch -d feature/your-feature-name  # Delete local branch
   ```

5. **Test on `dev` branch**

6. **Once approved, merge `dev` into `main`:**
   ```bash
   git checkout main
   git pull origin main
   git merge dev --no-ff -m "Merge dev into main: Release version X.X"
   git push origin main
   ```

### For Hotfixes (urgent fixes to production):

1. **Create hotfix branch from `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/issue-description
   ```

2. **Fix and commit:**
   ```bash
   git add .
   git commit -m "Hotfix: fix description"
   ```

3. **Merge hotfix into both `main` and `dev`:**
   ```bash
   # Merge to main
   git checkout main
   git merge hotfix/issue-description --no-ff -m "Hotfix: issue description"
   git push origin main
   
   # Merge to dev
   git checkout dev
   git merge hotfix/issue-description --no-ff -m "Hotfix: issue description"
   git push origin dev
   ```

## Best Practices

- Always pull latest changes before creating a new branch
- Use descriptive branch names: `feature/`, `fix/`, `hotfix/`
- Write clear commit messages
- Use `--no-ff` for merge commits to preserve branch history
- Delete feature branches after merging
- Never force push to `main` or `dev`
- Test thoroughly on `dev` before merging to `main`

