# SpotSave Deployment Guide

This guide walks you through deploying SpotSave to AWS Amplify with the custom domain `spotsave.pandeylabs.com`.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured with credentials
3. Git repository (GitHub, GitLab, or Bitbucket)
4. Domain `spotsave.pandeylabs.com` already configured in Route53

## Step 1: Deploy Amplify Backend (Cognito Auth)

First, deploy the Amplify backend to create the Cognito user pool:

```bash
# Make sure you're in the project directory
cd /Users/utkarshp845/SpotSave

# Deploy the backend (this creates the Cognito user pool)
npm run amplify-push
```

This will:
- Create the Cognito user pool
- Generate `amplify_outputs.json` file
- Deploy authentication resources

**Important**: Commit the generated `amplify_outputs.json` file to your repository (it's needed for the frontend).

## Step 2: Push Code to Git Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SpotSave app"

# Add remote (replace with your repository URL)
git remote add origin <your-repo-url>

# Push to main branch
git push -u origin main
```

## Step 3: Create Amplify App via AWS Console

1. **Go to AWS Amplify Console**:
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Sign in to your AWS account

2. **Create New App**:
   - Click "New app" → "Host web app"
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize AWS Amplify to access your repository
   - Select the repository: `SpotSave` (or your repo name)
   - Select the branch: `main` (or `master`)

3. **Configure Build Settings**:
   - Amplify should auto-detect Next.js
   - Verify the build settings:
     - **Build command**: `npm run build`
     - **Output directory**: `.next`
     - The `amplify.yml` file will be used automatically

4. **Environment Variables** (if needed):
   - Add any environment variables:
     - `MOCK_AWS=false` (for production)
     - `AWS_REGION=us-east-1` (or your preferred region)

5. **Review and Deploy**:
   - Review the configuration
   - Click "Save and deploy"
   - Wait for the build to complete (5-10 minutes)

## Step 4: Configure Custom Domain

Once the app is deployed, configure the custom domain:

1. **In Amplify Console**:
   - Go to your app → "Domain management" (left sidebar)
   - Click "Add domain"

2. **Enter Domain**:
   - Enter: `spotsave.pandeylabs.com`
   - Click "Configure domain"

3. **Domain Setup**:
   - Amplify will provide you with DNS records to add
   - **Important**: Since the domain already exists in Route53, you have two options:

   **Option A: Use Route53 (Recommended)**
   - Go to Route53 Console
   - Find the hosted zone for `pandeylabs.com`
   - Update the `spotsave` subdomain record:
     - Type: `CNAME` or `A` (Amplify will tell you which)
     - Name: `spotsave`
     - Value: The Amplify domain value (e.g., `d1234567890.cloudfront.net`)
     - TTL: 300

   **Option B: Let Amplify Manage DNS**
   - In Amplify, select "Use Route53" if available
   - Amplify will automatically update Route53 records

4. **SSL Certificate**:
   - Amplify will automatically provision an SSL certificate via AWS Certificate Manager
   - This may take 10-30 minutes
   - Wait for certificate validation to complete

5. **Verify Domain**:
   - Once DNS propagates (can take up to 48 hours, usually much faster)
   - Visit `https://spotsave.pandeylabs.com`
   - You should see your SpotSave app

## Step 5: Update Route53 Records (If Needed)

If Amplify didn't automatically update Route53, manually update:

1. **Go to Route53 Console**:
   - Navigate to [Route53 Console](https://console.aws.amazon.com/route53)
   - Select the hosted zone for `pandeylabs.com`

2. **Update or Create Record**:
   - Find or create record for `spotsave`
   - Record type: `CNAME` (or `A` if Amplify provides an IP)
   - Name: `spotsave` (or `spotsave.pandeylabs.com`)
   - Value: The CloudFront distribution domain from Amplify
   - TTL: 300 seconds

3. **Wait for Propagation**:
   - DNS changes can take 5 minutes to 48 hours
   - Usually takes 5-15 minutes

## Step 6: Verify Deployment

1. **Test the App**:
   - Visit `https://spotsave.pandeylabs.com`
   - You should see the SpotSave login page
   - Try signing up for a new account
   - Test the AWS connection wizard

2. **Check Build Logs**:
   - In Amplify Console → "Build history"
   - Verify the build completed successfully
   - Check for any errors

3. **Monitor Performance**:
   - Check Amplify Console → "Monitoring"
   - Verify no errors in logs

## Troubleshooting

### Build Fails

- **Error: "amplify_outputs.json not found"**:
  - Make sure you ran `npm run amplify-push` before deploying
  - Commit `amplify_outputs.json` to your repository

- **Error: "Module not found"**:
  - Check that all dependencies are in `package.json`
  - Run `npm install` locally to verify

### Domain Not Working

- **DNS not resolving**:
  - Check Route53 records are correct
  - Verify TTL has passed
  - Use `dig spotsave.pandeylabs.com` or `nslookup spotsave.pandeylabs.com` to check

- **SSL Certificate Issues**:
  - Wait for certificate validation (can take 30+ minutes)
  - Check Certificate Manager for validation status

### App Not Loading

- **Check Amplify Logs**:
  - Go to Amplify Console → "Monitoring" → "Logs"
  - Look for runtime errors

- **Verify Environment Variables**:
  - Check that `amplify_outputs.json` is accessible
  - Verify all API routes are working

## Post-Deployment Checklist

- [ ] App loads at `https://spotsave.pandeylabs.com`
- [ ] SSL certificate is active (HTTPS works)
- [ ] User can sign up for new account
- [ ] User can sign in
- [ ] AWS connection wizard works
- [ ] Dashboard displays data (or mock data)
- [ ] All API routes respond correctly
- [ ] Export functionality works

## Continuous Deployment

Once set up, Amplify will automatically:
- Deploy on every push to the connected branch
- Run builds automatically
- Update the live site

To deploy manually:
- Go to Amplify Console → "Redeploy this version"

## Additional Configuration

### Custom Headers (Optional)

You can add custom headers in `next.config.js` if needed for security:

```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
      ],
    },
  ];
}
```

### Environment-Specific Settings

Create different Amplify apps for staging/production:
- Staging: `staging-spotsave.pandeylabs.com`
- Production: `spotsave.pandeylabs.com`

## Support

If you encounter issues:
1. Check Amplify build logs
2. Check Route53 DNS records
3. Verify SSL certificate status
4. Review AWS CloudWatch logs

