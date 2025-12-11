# Quick Deployment Checklist - Vercel

## Before Deployment

- [ ] Code is committed and pushed to Git
- [ ] You're on the `new` branch: `git checkout new`
- [ ] Branch is pushed to remote: `git push origin new`
- [ ] Build works locally: `npm run build` (no errors)
- [ ] All dependencies are in `package.json`
- [ ] No sensitive data in code (use environment variables if needed)

## Deployment Steps

### Option A: Via Vercel Dashboard (Easiest)

1. [ ] Go to [vercel.com](https://vercel.com) and sign in
2. [ ] Click **"Add New..."** → **"Project"**
3. [ ] Import your repository
4. [ ] Select branch: **"new"**
5. [ ] Framework: **Next.js** (auto-detected)
6. [ ] Build Command: `npm run build` (auto-detected)
7. [ ] Click **"Deploy"**
8. [ ] Wait for build to complete
9. [ ] Visit your deployment URL

### Option B: Via Vercel CLI

1. [ ] Install Vercel CLI: `npm install -g vercel`
2. [ ] Login: `vercel login`
3. [ ] Navigate to project: `cd D:\zefrix`
4. [ ] Switch to branch: `git checkout new`
5. [ ] Deploy: `vercel --prod --branch new`

## After Deployment

- [ ] Test the live site URL
- [ ] Check Firebase authentication works
- [ ] Verify all pages load correctly
- [ ] Test forms and interactions
- [ ] Check browser console for errors
- [ ] Review Vercel build logs for warnings

## Common Issues

- **Build fails?** → Check build logs in Vercel dashboard
- **Firebase not working?** → Check browser console
- **404 errors?** → Verify all routes are correct
- **Slow loading?** → Check image optimization settings

## Need Help?

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

