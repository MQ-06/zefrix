# Vercel Deployment Guide - Step by Step

This guide will help you deploy your Zefrix project to Vercel, specifically deploying the `new` branch.

## Prerequisites

1. ✅ Your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
2. ✅ You have a Vercel account (sign up at [vercel.com](https://vercel.com) if you don't have one)
3. ✅ Your `new` branch is pushed to the remote repository

---

## Method 1: Deploy via Vercel Dashboard (Recommended for First Time)

### Step 1: Push Your `new` Branch to Remote

If you haven't already, push your `new` branch to your Git repository:

```bash
# Make sure you're on the 'new' branch
git checkout new

# Push the branch to remote (replace 'origin' with your remote name if different)
git push origin new
```

### Step 2: Sign in to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Sign in with GitHub, GitLab, or Bitbucket (recommended for easy integration)

### Step 3: Import Your Project

1. Once logged in, click **"Add New..."** → **"Project"**
2. You'll see a list of your repositories
3. Find your **Zefrix repository** and click **"Import"**

### Step 4: Configure Project Settings

1. **Project Name**: Enter a name (e.g., "zefrix" or "zefrix-new")
2. **Framework Preset**: Vercel should auto-detect **Next.js** - keep it as is
3. **Root Directory**: Leave as `./` (unless your Next.js app is in a subdirectory)
4. **Build Command**: Should be `npm run build` (auto-detected)
5. **Output Directory**: Leave empty (Next.js handles this automatically)
6. **Install Command**: Should be `npm install` (auto-detected)

### Step 5: Select Branch to Deploy

1. In the **"Git"** section, click on the branch dropdown
2. Select **"new"** from the list
3. This will deploy the `new` branch instead of `main`/`master`

### Step 6: Environment Variables (Important!)

Since your project uses Firebase, you'll need to add environment variables. However, since Firebase config is hardcoded in your code, you might not need them unless you want to make it configurable.

**If you want to add environment variables later:**
1. Go to your project settings in Vercel
2. Navigate to **"Environment Variables"**
3. Add any variables you need

**For now, you can skip this step** since Firebase config is in the code.

### Step 7: Deploy!

1. Click **"Deploy"** button
2. Vercel will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your project (`npm run build`)
   - Deploy it to a production URL

### Step 8: Wait for Deployment

1. You'll see a deployment log in real-time
2. Wait for the build to complete (usually 2-5 minutes)
3. Once done, you'll see **"Ready"** status
4. Click on the deployment URL to view your live site!

---

## Method 2: Deploy via Vercel CLI (Alternative)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser window for authentication.

### Step 3: Navigate to Your Project

```bash
cd D:\zefrix
```

### Step 4: Switch to `new` Branch

```bash
git checkout new
```

### Step 5: Deploy

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time) or Yes (if redeploying)
- **Project name?** → Enter a name (e.g., "zefrix")
- **Directory?** → Press Enter (use current directory)
- **Override settings?** → No

### Step 6: Production Deployment

For production deployment:

```bash
vercel --prod
```

Or to deploy a specific branch:

```bash
vercel --prod --branch new
```

---

## Method 3: Connect via Git Integration (Automatic Deployments)

### Step 1: Connect Repository in Vercel

1. Go to Vercel Dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Vercel will automatically detect your Next.js project

### Step 2: Configure Branch

1. In project settings, go to **"Git"**
2. Under **"Production Branch"**, you can:
   - Keep it as `main`/`master` for production
   - Or set up branch-specific deployments

### Step 3: Set Up Branch Deployments

1. Go to **"Settings"** → **"Git"**
2. Enable **"Automatic deployments from Git"**
3. Vercel will automatically deploy:
   - **Production**: `main` or `master` branch
   - **Preview**: All other branches (including `new`)

### Step 4: Deploy `new` Branch

1. Every time you push to the `new` branch, Vercel will:
   - Create a preview deployment
   - Give you a unique URL (e.g., `zefrix-git-new-yourusername.vercel.app`)
2. You can promote a preview deployment to production if needed

---

## Post-Deployment Checklist

### ✅ Verify Deployment

1. Visit your deployment URL
2. Check that the site loads correctly
3. Test key features:
   - Home page loads
   - Firebase authentication works
   - Navigation works
   - Forms submit correctly

### ✅ Check Build Logs

1. In Vercel dashboard, go to **"Deployments"**
2. Click on your deployment
3. Check the **"Build Logs"** for any warnings or errors
4. Fix any issues if found

### ✅ Set Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Add your custom domain
3. Follow DNS configuration instructions

### ✅ Monitor Performance

1. Check **"Analytics"** tab for performance metrics
2. Monitor **"Functions"** for serverless function usage
3. Check **"Logs"** for any runtime errors

---

## Troubleshooting Common Issues

### Issue 1: Build Fails

**Error**: `TypeError: r(...) is not a constructor`

**Solution**: This was fixed in the latest code. Make sure you've:
- Pushed the latest changes to the `new` branch
- The Firebase initialization is in `AuthContext.tsx`, not in `layout.tsx` head

### Issue 2: Firebase Not Working

**Error**: Firebase not initialized

**Solution**: 
- Check browser console for errors
- Verify Firebase config is correct
- Make sure all Firebase scripts load properly

### Issue 3: Environment Variables Missing

**Error**: API keys not found

**Solution**:
- Add environment variables in Vercel dashboard
- Go to **"Settings"** → **"Environment Variables"**
- Add required variables for all environments (Production, Preview, Development)

### Issue 4: Build Timeout

**Error**: Build exceeded time limit

**Solution**:
- Optimize your build process
- Remove unnecessary dependencies
- Check for large files in your repository
- Consider upgrading Vercel plan if needed

### Issue 5: Branch Not Found

**Error**: Branch `new` not found

**Solution**:
- Make sure you've pushed the `new` branch: `git push origin new`
- Refresh the Vercel dashboard
- Check branch name spelling

---

## Quick Reference Commands

```bash
# Switch to new branch
git checkout new

# Push branch to remote
git push origin new

# Deploy via CLI (preview)
vercel

# Deploy via CLI (production)
vercel --prod

# Deploy specific branch
vercel --prod --branch new

# View deployments
vercel ls

# View logs
vercel logs
```

---

## Next Steps After Deployment

1. **Test the live site** thoroughly
2. **Set up monitoring** (Vercel Analytics)
3. **Configure custom domain** if needed
4. **Set up automatic deployments** for continuous integration
5. **Add environment variables** if you need to make config dynamic
6. **Set up preview deployments** for pull requests

---

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

**Good luck with your deployment! 🚀**

