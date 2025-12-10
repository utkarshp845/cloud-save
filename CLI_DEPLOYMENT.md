# CLI Deployment Guide - spotsave.pandeylabs.com

## Current Status

✅ Code pushed to GitHub: `https://github.com/utkarshp845/cloud-save.git`  
⏳ GitHub OAuth setup required (one-time, browser-based)  
⏳ Amplify app creation  
⏳ Domain configuration  

## Step-by-Step Deployment

### Step 1: Set Up GitHub OAuth (One-Time)

This is a browser-based step that must be done first:

1. **Open AWS Amplify Console**:
   ```
   https://console.aws.amazon.com/amplify/home?region=us-east-1
   ```

2. **Connect GitHub**:
   - Click **"New app"** → **"Host web app"**
   - Select **"GitHub"**
   - Click **"Authorize"** and follow the prompts
   - Grant AWS Amplify access to your GitHub account

3. **After authorization**, you have two options:

   **Option A: Create app in Console (Recommended for first time)**
   - Complete the app creation in the browser
   - Repository: `https://github.com/utkarshp845/cloud-save.git`
   - Branch: `main`
   - App name: `spotsave`
   - After creation, run: `./setup-domain.sh`

   **Option B: Create app via CLI**
   - After OAuth is set up, run: `./deploy-final.sh`

### Step 2: Configure Domain (After App is Created)

Once the Amplify app exists, configure the custom domain:

```bash
./setup-domain.sh
```

This script will:
- ✅ Find your Amplify app
- ✅ Create domain association for `spotsave.pandeylabs.com`
- ✅ Get CloudFront distribution domain
- ✅ Update Route53 CNAME record
- ✅ Provide monitoring commands

### Step 3: Wait for Deployment

After domain configuration:

1. **Build Completion**: Check Amplify Console for build status
2. **SSL Certificate**: Wait 10-30 minutes for certificate validation
3. **DNS Propagation**: Wait 5-15 minutes for DNS to propagate

### Step 4: Verify

```bash
# Check app status
aws amplify get-app --app-id <APP_ID> --region us-east-1

# Check domain status
aws amplify get-domain-association \
  --app-id <APP_ID> \
  --domain-name spotsave.pandeylabs.com \
  --region us-east-1

# Test DNS
dig spotsave.pandeylabs.com
```

Visit: `https://spotsave.pandeylabs.com`

## Quick Commands

### Find Your App ID
```bash
aws amplify list-apps --region us-east-1 --query "apps[?name=='spotsave'].appId" --output text
```

### Check Domain Status
```bash
APP_ID=$(aws amplify list-apps --region us-east-1 --query "apps[?name=='spotsave'].appId" --output text)
aws amplify get-domain-association \
  --app-id $APP_ID \
  --domain-name spotsave.pandeylabs.com \
  --region us-east-1
```

### Check Route53 Record
```bash
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='pandeylabs.com.'].Id" --output text | sed 's|/hostedzone/||')
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Name=='spotsave.pandeylabs.com.']"
```

### Trigger New Deployment
```bash
APP_ID=$(aws amplify list-apps --region us-east-1 --query "apps[?name=='spotsave'].appId" --output text)
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

## Troubleshooting

### "GitHub OAuth not configured"
- **Solution**: Complete Step 1 above (browser-based OAuth setup)

### "App not found"
- **Solution**: Create the app first (either in console or after OAuth setup)

### "CloudFront domain not available"
- **Solution**: Wait a few minutes after domain association, then re-run `./setup-domain.sh`

### "Hosted zone not found"
- **Solution**: Verify Route53 hosted zone for `pandeylabs.com` exists

### Build Fails
- **Check**: `amplify_outputs.json` should be committed (it's needed for builds)
- **Fix**: Run `npm run amplify-push` locally and commit the file

## Files Reference

- `deploy-final.sh` - Full deployment (requires OAuth first)
- `setup-domain.sh` - Domain configuration only (run after app creation)
- `CLI_DEPLOYMENT.md` - This file

## Next Steps

1. **Set up GitHub OAuth** (browser): https://console.aws.amazon.com/amplify/home?region=us-east-1
2. **Create Amplify app** (console or CLI)
3. **Run domain setup**: `./setup-domain.sh`
4. **Wait and verify**: Check SSL and DNS, then test the site

---

**Need help?** Check AWS Console → Amplify → Your App for detailed logs and status.

