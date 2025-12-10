# Quick Deployment Guide - spotsave.pandeylabs.com

## Quick Steps

### 1. Deploy Backend
```bash
npm run amplify-push
```

### 2. Commit & Push Code
```bash
git add .
git commit -m "Deploy SpotSave to Amplify"
git push origin main
```

### 3. Create Amplify App (AWS Console)

1. Go to: https://console.aws.amazon.com/amplify
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Select branch: `main`
5. Build settings (auto-detected):
   - Build command: `npm run build`
   - Output directory: `.next`
6. Click "Save and deploy"

### 4. Configure Custom Domain

1. In Amplify Console → Your App → "Domain management"
2. Click "Add domain"
3. Enter: `spotsave.pandeylabs.com`
4. Click "Configure domain"

### 5. Update Route53

**Option A: Amplify Auto-Update (if available)**
- Select "Use Route53" in Amplify
- Amplify will update records automatically

**Option B: Manual Update**
1. Go to Route53 Console
2. Find hosted zone: `pandeylabs.com`
3. Update record for `spotsave`:
   - Type: `CNAME`
   - Name: `spotsave`
   - Value: [CloudFront domain from Amplify]
   - TTL: 300

### 6. Wait & Verify

- SSL certificate: 10-30 minutes
- DNS propagation: 5-15 minutes (up to 48 hours)
- Test: `https://spotsave.pandeylabs.com`

## Troubleshooting

**Domain not working?**
- Check Route53 record matches Amplify CloudFront domain
- Wait for DNS propagation
- Verify SSL certificate is validated

**Build failing?**
- Check `amplify_outputs.json` is committed
- Verify all dependencies in `package.json`
- Check build logs in Amplify Console

## Support Files

- Full guide: `DEPLOYMENT.md`
- Deployment script: `./deploy.sh`

