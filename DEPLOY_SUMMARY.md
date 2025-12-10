# Deployment Summary - spotsave.pandeylabs.com

## ✅ What's Been Prepared

1. **Amplify Configuration** (`amplify.yml`)
   - Configured for Next.js 15 with SSR
   - Includes backend deployment step
   - Optimized caching

2. **Next.js Configuration** (`next.config.js`)
   - Standalone output mode for Amplify
   - Security headers configured
   - Environment variables set

3. **Deployment Scripts**
   - `deploy.sh` - Automated deployment helper
   - `DEPLOYMENT.md` - Full deployment guide
   - `QUICK_DEPLOY.md` - Quick reference
   - `DOMAIN_SETUP.md` - Domain-specific guide

## 🚀 Deployment Steps

### Step 1: Deploy Backend (Run This First)

```bash
cd /Users/utkarshp845/SpotSave
npm run amplify-push
```

This creates the Cognito user pool and generates `amplify_outputs.json`.

**Important**: Commit `amplify_outputs.json` to your repository (it's needed for builds).

### Step 2: Prepare Git Repository

```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit: SpotSave app"

# Add your remote (replace with your repo URL)
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 3: Create Amplify App (AWS Console)

1. Go to: **https://console.aws.amazon.com/amplify**
2. Click **"New app"** → **"Host web app"**
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select repository: **SpotSave**
5. Select branch: **main**
6. Build settings (auto-detected):
   - Build command: `npm run build`
   - Output directory: `.next`
7. Click **"Save and deploy"**

### Step 4: Configure Custom Domain

1. In Amplify Console → Your App → **"Domain management"**
2. Click **"Add domain"**
3. Enter: **`spotsave.pandeylabs.com`**
4. Click **"Configure domain"**

### Step 5: Update Route53

**Get the CloudFront domain from Amplify Console**, then:

1. Go to **Route53 Console** → **Hosted zones** → **pandeylabs.com**
2. Find or create record for **`spotsave`**
3. Update:
   - **Type**: `CNAME`
   - **Name**: `spotsave`
   - **Value**: [CloudFront domain from Amplify]
   - **TTL**: 300
4. Save

### Step 6: Wait & Verify

- **SSL Certificate**: 10-30 minutes
- **DNS Propagation**: 5-15 minutes (up to 48 hours)
- **Test**: Visit `https://spotsave.pandeylabs.com`

## 📋 Quick Checklist

- [ ] Backend deployed (`npm run amplify-push`)
- [ ] `amplify_outputs.json` committed to git
- [ ] Code pushed to repository
- [ ] Amplify app created and connected to repo
- [ ] Build successful in Amplify Console
- [ ] Custom domain added: `spotsave.pandeylabs.com`
- [ ] Route53 record updated with CloudFront domain
- [ ] SSL certificate validated
- [ ] DNS propagated (check with `dig spotsave.pandeylabs.com`)
- [ ] App loads at `https://spotsave.pandeylabs.com`
- [ ] Authentication works
- [ ] Dashboard loads

## 🔧 Troubleshooting

### Build Fails
- **Error**: "amplify_outputs.json not found"
  - **Fix**: Run `npm run amplify-push` and commit the file

### Domain Not Working
- **Check**: Route53 record matches Amplify CloudFront domain exactly
- **Wait**: DNS can take up to 48 hours (usually 5-15 minutes)
- **Verify**: Use `dig spotsave.pandeylabs.com` to check DNS

### SSL Issues
- **Check**: Certificate Manager for validation status
- **Wait**: SSL validation can take 10-30 minutes

## 📚 Documentation Files

- **Full Guide**: `DEPLOYMENT.md`
- **Quick Reference**: `QUICK_DEPLOY.md`
- **Domain Setup**: `DOMAIN_SETUP.md`
- **Deployment Script**: `./deploy.sh`

## 🎯 Expected Result

After deployment, you should have:
- ✅ App running at `https://spotsave.pandeylabs.com`
- ✅ SSL certificate active
- ✅ Automatic deployments on git push
- ✅ All features working (auth, dashboard, AWS connection)

## 💡 Pro Tips

1. **Test locally first**: Run `npm run dev` and verify everything works
2. **Check build logs**: Monitor the first deployment in Amplify Console
3. **DNS propagation**: Use `dig` or online tools to check DNS status
4. **Multiple environments**: Consider creating separate Amplify apps for staging/prod

## 🆘 Need Help?

1. Check Amplify Console → Build logs
2. Check Route53 → Record status
3. Check Certificate Manager → Certificate status
4. Review `DEPLOYMENT.md` for detailed troubleshooting

---

**Ready to deploy?** Start with Step 1: `npm run amplify-push`

