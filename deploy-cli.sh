#!/bin/bash

# SpotSave CLI Deployment Script
# This script deploys SpotSave to AWS Amplify via CLI

set -e

APP_NAME="spotsave"
DOMAIN="spotsave.pandeylabs.com"
REGION="us-east-1"

echo "🚀 SpotSave CLI Deployment"
echo "=========================="
echo ""

# Step 1: Deploy Amplify Backend
echo "📦 Step 1: Deploying Amplify Backend (Cognito)..."
npm run amplify-push

if [ ! -f "amplify_outputs.json" ]; then
    echo "❌ Error: amplify_outputs.json not generated. Deployment failed."
    exit 1
fi

echo "✅ Backend deployed successfully"
echo ""

# Step 2: Check Git repository
echo "📝 Step 2: Checking Git repository..."
if [ ! -d ".git" ]; then
    echo "⚠️  Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: SpotSave app"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository found"
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  Uncommitted changes detected. Committing..."
        git add .
        git commit -m "Deploy SpotSave to Amplify" || echo "No changes to commit"
    fi
fi

# Get repository URL if remote exists
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REPO_URL" ]; then
    echo ""
    echo "⚠️  No Git remote found. You'll need to:"
    echo "   1. Create a repository on GitHub/GitLab/Bitbucket"
    echo "   2. Add remote: git remote add origin <your-repo-url>"
    echo "   3. Push: git push -u origin main"
    echo ""
    read -p "Do you want to continue with manual repo setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Step 3: Check if Amplify app already exists
echo "🔍 Step 3: Checking for existing Amplify app..."
APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "📱 Step 4: Creating new Amplify app..."
    
    # Check if we have a repo URL
    if [ -z "$REPO_URL" ]; then
        echo "❌ Error: Cannot create Amplify app without Git repository."
        echo "   Please set up your Git repository first:"
        echo "   1. Create repo on GitHub/GitLab/Bitbucket"
        echo "   2. Run: git remote add origin <your-repo-url>"
        echo "   3. Run: git push -u origin main"
        echo "   4. Re-run this script"
        exit 1
    fi
    
    # Determine provider and extract repo details
    if [[ $REPO_URL == *"github.com"* ]]; then
        PROVIDER="GITHUB"
        # Extract owner/repo from URL
        REPO_PATH=$(echo $REPO_URL | sed -E 's/.*github\.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
        OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
        REPO=$(echo $REPO_PATH | cut -d'/' -f2 | sed 's/\.git$//')
        BRANCH="main"
    elif [[ $REPO_URL == *"gitlab.com"* ]]; then
        PROVIDER="GITLAB"
        REPO_PATH=$(echo $REPO_URL | sed -E 's/.*gitlab\.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
        OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
        REPO=$(echo $REPO_PATH | cut -d'/' -f2 | sed 's/\.git$//')
        BRANCH="main"
    elif [[ $REPO_URL == *"bitbucket.org"* ]]; then
        PROVIDER="BITBUCKET"
        REPO_PATH=$(echo $REPO_URL | sed -E 's/.*bitbucket\.org[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
        OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
        REPO=$(echo $REPO_PATH | cut -d'/' -f2 | sed 's/\.git$//')
        BRANCH="main"
    else
        echo "❌ Error: Unsupported Git provider. Please use GitHub, GitLab, or Bitbucket."
        exit 1
    fi
    
    echo "   Provider: $PROVIDER"
    echo "   Repository: $OWNER/$REPO"
    echo "   Branch: $BRANCH"
    echo ""
    echo "   ⚠️  Note: You may need to authorize Amplify to access your repository."
    echo "   This requires OAuth setup in AWS Console for first-time use."
    echo ""
    read -p "Continue with app creation? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Create Amplify app
    echo "   Creating Amplify app..."
    CREATE_RESULT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --region $REGION \
        --repository "$REPO_URL" \
        --platform WEB \
        --environment-variables MOCK_AWS=false \
        --output json 2>&1) || {
        echo "❌ Error creating Amplify app:"
        echo "$CREATE_RESULT"
        echo ""
        echo "💡 Tip: If you get an OAuth error, you need to:"
        echo "   1. Go to AWS Console → Amplify → Settings → App settings"
        echo "   2. Connect your Git provider (one-time setup)"
        echo "   3. Re-run this script"
        exit 1
    }
    
    APP_ID=$(echo $CREATE_RESULT | jq -r '.app.appId')
    echo "✅ Amplify app created: $APP_ID"
    
    # Create branch
    echo "   Creating branch: $BRANCH"
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --region $REGION \
        --output json > /dev/null 2>&1 || echo "   Branch may already exist"
    
    # Start deployment
    echo "   Starting deployment..."
    JOB_ID=$(aws amplify start-job \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --job-type RELEASE \
        --region $REGION \
        --query 'jobSummary.jobId' \
        --output text)
    
    echo "✅ Deployment started. Job ID: $JOB_ID"
    echo "   Monitor progress: aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID"
else
    echo "✅ Amplify app already exists: $APP_ID"
    BRANCH="main"
fi

echo ""

# Step 5: Configure Custom Domain
echo "🌐 Step 5: Configuring custom domain: $DOMAIN"

# Check if domain already exists
DOMAIN_ASSOCIATION=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json 2>/dev/null || echo "")

if [ -z "$DOMAIN_ASSOCIATION" ]; then
    echo "   Creating domain association..."
    aws amplify create-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$DOMAIN" \
        --region $REGION \
        --sub-domain-settings prefix=,branchName="$BRANCH" \
        --output json > /dev/null
    
    echo "✅ Domain association created"
    echo "   Waiting for domain verification (this may take a few minutes)..."
    
    # Wait for domain to be available
    for i in {1..30}; do
        sleep 5
        STATUS=$(aws amplify get-domain-association \
            --app-id "$APP_ID" \
            --domain-name "$DOMAIN" \
            --region $REGION \
            --query 'domainAssociation.domainStatus' \
            --output text 2>/dev/null || echo "PENDING")
        
        if [ "$STATUS" = "AVAILABLE" ] || [ "$STATUS" = "PENDING_VERIFICATION" ]; then
            echo "✅ Domain status: $STATUS"
            break
        fi
        echo "   Waiting... ($i/30)"
    done
else
    echo "✅ Domain already associated"
fi

# Get domain details
DOMAIN_INFO=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json)

CLOUDFRONT_DOMAIN=$(echo $DOMAIN_INFO | jq -r '.domainAssociation.subDomains[0].dnsRecord')
CERTIFICATE_ARN=$(echo $DOMAIN_INFO | jq -r '.domainAssociation.certificateVerificationDNSRecord')

echo ""
echo "📋 Domain Information:"
echo "   CloudFront Domain: $CLOUDFRONT_DOMAIN"
if [ "$CERTIFICATE_ARN" != "null" ] && [ -n "$CERTIFICATE_ARN" ]; then
    echo "   Certificate ARN: $CERTIFICATE_ARN"
fi

echo ""

# Step 6: Update Route53
echo "🗺️  Step 6: Updating Route53 records..."

# Extract hosted zone for pandeylabs.com
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='pandeylabs.com.'].Id" \
    --output text | sed 's|/hostedzone/||')

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Error: Hosted zone for 'pandeylabs.com' not found in Route53"
    echo "   Please create the hosted zone first or check the domain name"
    exit 1
fi

echo "   Found hosted zone: $HOSTED_ZONE_ID"

# Extract the value from CloudFront domain (format: d1234567890.cloudfront.net)
CLOUDFRONT_VALUE=$(echo $CLOUDFRONT_DOMAIN | grep -oP 'd[\w]+\.cloudfront\.net' || echo "")

if [ -z "$CLOUDFRONT_VALUE" ]; then
    echo "⚠️  Warning: Could not extract CloudFront domain value"
    echo "   Please manually update Route53 with: $CLOUDFRONT_DOMAIN"
else
    # Check if record exists
    EXISTING_RECORD=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --query "ResourceRecordSets[?Name=='spotsave.pandeylabs.com.']" \
        --output json)
    
    if [ "$EXISTING_RECORD" != "[]" ]; then
        echo "   Updating existing Route53 record..."
        
        # Get existing record details
        EXISTING_TYPE=$(echo $EXISTING_RECORD | jq -r '.[0].Type')
        EXISTING_TTL=$(echo $EXISTING_RECORD | jq -r '.[0].TTL')
        
        # Update record
        CHANGE_BATCH=$(cat <<EOF
{
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "spotsave.pandeylabs.com.",
            "Type": "CNAME",
            "TTL": ${EXISTING_TTL:-300},
            "ResourceRecords": [{"Value": "$CLOUDFRONT_VALUE"}]
        }
    }]
}
EOF
)
    else
        echo "   Creating new Route53 record..."
        CHANGE_BATCH=$(cat <<EOF
{
    "Changes": [{
        "Action": "CREATE",
        "ResourceRecordSet": {
            "Name": "spotsave.pandeylabs.com.",
            "Type": "CNAME",
            "TTL": 300,
            "ResourceRecords": [{"Value": "$CLOUDFRONT_VALUE"}]
        }
    }]
}
EOF
)
    fi
    
    # Apply change
    CHANGE_ID=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "$CHANGE_BATCH" \
        --query 'ChangeInfo.Id' \
        --output text)
    
    echo "✅ Route53 record updated. Change ID: $CHANGE_ID"
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📊 Summary:"
echo "   App ID: $APP_ID"
echo "   Domain: https://$DOMAIN"
echo "   Region: $REGION"
echo ""
echo "⏳ Next Steps:"
echo "   1. Wait for SSL certificate validation (10-30 minutes)"
echo "   2. Wait for DNS propagation (5-15 minutes)"
echo "   3. Test: https://$DOMAIN"
echo ""
echo "🔍 Monitor deployment:"
echo "   aws amplify get-app --app-id $APP_ID --region $REGION"
echo ""
echo "📝 Check domain status:"
echo "   aws amplify get-domain-association --app-id $APP_ID --domain-name $DOMAIN --region $REGION"

