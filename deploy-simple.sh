#!/bin/bash

# Simplified SpotSave Deployment via AWS CLI
# This script creates the Amplify app and configures the domain

set -e

APP_NAME="spotsave"
DOMAIN="spotsave.pandeylabs.com"
REGION="us-east-1"

echo "🚀 SpotSave CLI Deployment (Simplified)"
echo "========================================"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Step 1: Check if Amplify app exists
echo "📱 Step 1: Checking for existing Amplify app..."
APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "   No existing app found. Creating new Amplify app..."
    echo ""
    echo "⚠️  IMPORTANT: Before creating the app, you need to:"
    echo "   1. Push your code to a Git repository (GitHub/GitLab/Bitbucket)"
    echo "   2. Get the repository URL"
    echo ""
    read -p "Do you have a Git repository URL? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📝 Setting up Git repository..."
        
        # Initialize git if needed
        if [ ! -d ".git" ]; then
            git init
            git add .
            git commit -m "Initial commit: SpotSave app"
            echo "✅ Git repository initialized"
        fi
        
        echo ""
        echo "Next steps:"
        echo "1. Create a repository on GitHub/GitLab/Bitbucket"
        echo "2. Add remote: git remote add origin <your-repo-url>"
        echo "3. Push: git push -u origin main"
        echo "4. Re-run this script with the repository URL"
        exit 0
    fi
    
    read -p "Enter your Git repository URL: " REPO_URL
    echo ""
    
    # Determine provider
    if [[ $REPO_URL == *"github.com"* ]]; then
        PROVIDER="GITHUB"
    elif [[ $REPO_URL == *"gitlab.com"* ]]; then
        PROVIDER="GITLAB"
    elif [[ $REPO_URL == *"bitbucket.org"* ]]; then
        PROVIDER="BITBUCKET"
    else
        echo "❌ Unsupported Git provider. Use GitHub, GitLab, or Bitbucket."
        exit 1
    fi
    
    echo "   Creating Amplify app..."
    echo "   Repository: $REPO_URL"
    echo "   Provider: $PROVIDER"
    echo ""
    echo "   ⚠️  Note: First-time setup requires OAuth authorization in AWS Console"
    echo "   If this fails, go to: AWS Console → Amplify → Settings → App settings"
    echo "   and connect your Git provider, then re-run this script."
    echo ""
    
    # Create app
    CREATE_OUTPUT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --region $REGION \
        --repository "$REPO_URL" \
        --platform WEB \
        --environment-variables MOCK_AWS=false \
        --output json 2>&1) || {
        echo "❌ Error creating app:"
        echo "$CREATE_OUTPUT" | head -20
        echo ""
        echo "💡 Common issues:"
        echo "   - OAuth not configured: Connect Git provider in AWS Console"
        echo "   - Invalid repo URL: Check the repository URL"
        echo "   - Permissions: Ensure you have amplify:CreateApp permission"
        exit 1
    }
    
    APP_ID=$(echo "$CREATE_OUTPUT" | jq -r '.app.appId')
    echo "✅ Amplify app created: $APP_ID"
    
    # Create main branch
    echo "   Creating main branch..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "main" \
        --region $REGION \
        --output json > /dev/null 2>&1 || echo "   Branch may already exist"
    
    # Start deployment
    echo "   Starting initial deployment..."
    JOB_ID=$(aws amplify start-job \
        --app-id "$APP_ID" \
        --branch-name "main" \
        --job-type RELEASE \
        --region $REGION \
        --query 'jobSummary.jobId' \
        --output text 2>&1) || {
        echo "   ⚠️  Could not start deployment automatically"
        echo "   You can start it manually in AWS Console"
    }
    
    if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
        echo "✅ Deployment started. Job ID: $JOB_ID"
    fi
else
    echo "✅ Amplify app exists: $APP_ID"
fi

echo ""

# Step 2: Configure Custom Domain
echo "🌐 Step 2: Configuring custom domain: $DOMAIN"

# Check if domain already associated
DOMAIN_EXISTS=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json 2>/dev/null || echo "")

if [ -z "$DOMAIN_EXISTS" ] || [ "$DOMAIN_EXISTS" == "null" ]; then
    echo "   Creating domain association..."
    
    CREATE_DOMAIN_OUTPUT=$(aws amplify create-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$DOMAIN" \
        --region $REGION \
        --sub-domain-settings prefix=,branchName=main \
        --output json 2>&1) || {
        echo "❌ Error creating domain association:"
        echo "$CREATE_DOMAIN_OUTPUT" | head -20
        exit 1
    }
    
    echo "✅ Domain association created"
    echo "   Waiting for domain verification..."
    
    # Wait for domain status
    for i in {1..30}; do
        sleep 3
        STATUS=$(aws amplify get-domain-association \
            --app-id "$APP_ID" \
            --domain-name "$DOMAIN" \
            --region $REGION \
            --query 'domainAssociation.domainStatus' \
            --output text 2>/dev/null || echo "PENDING")
        
        if [ "$STATUS" = "AVAILABLE" ] || [ "$STATUS" = "PENDING_VERIFICATION" ] || [ "$STATUS" = "PENDING_DEPLOYMENT" ]; then
            echo "   Domain status: $STATUS"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "   ⚠️  Timeout waiting for domain status"
        fi
    done
else
    echo "✅ Domain already associated"
fi

# Get domain details
echo ""
echo "📋 Fetching domain information..."
DOMAIN_INFO=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json)

# Extract CloudFront domain
SUBDOMAINS=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.subDomains')
CLOUDFRONT_DOMAIN=$(echo "$SUBDOMAINS" | jq -r '.[0].dnsRecord' 2>/dev/null || echo "")

if [ -z "$CLOUDFRONT_DOMAIN" ] || [ "$CLOUDFRONT_DOMAIN" == "null" ]; then
    # Try alternative extraction
    CLOUDFRONT_DOMAIN=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.subDomains[0].dnsRecord' 2>/dev/null || echo "")
fi

if [ -z "$CLOUDFRONT_DOMAIN" ] || [ "$CLOUDFRONT_DOMAIN" == "null" ]; then
    echo "⚠️  Could not extract CloudFront domain from Amplify response"
    echo "   Domain info:"
    echo "$DOMAIN_INFO" | jq '.' | head -30
    echo ""
    echo "   Please check AWS Console for the CloudFront domain"
    CLOUDFRONT_DOMAIN="<check-amplify-console>"
else
    echo "✅ CloudFront Domain: $CLOUDFRONT_DOMAIN"
fi

echo ""

# Step 3: Update Route53
echo "🗺️  Step 3: Updating Route53 records..."

# Find hosted zone
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='pandeylabs.com.'].Id" \
    --output text | sed 's|/hostedzone/||' | head -1)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Error: Hosted zone for 'pandeylabs.com' not found"
    echo "   Please ensure the hosted zone exists in Route53"
    exit 1
fi

echo "✅ Found hosted zone: $HOSTED_ZONE_ID"

# Extract CloudFront value (should be in format dXXXXX.cloudfront.net)
if [[ "$CLOUDFRONT_DOMAIN" == *"cloudfront.net"* ]]; then
    CLOUDFRONT_VALUE="$CLOUDFRONT_DOMAIN"
    
    # Check existing record
    EXISTING_RECORD=$(aws route53 list-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --query "ResourceRecordSets[?Name=='spotsave.pandeylabs.com.']" \
        --output json)
    
    if [ "$EXISTING_RECORD" != "[]" ] && [ -n "$EXISTING_RECORD" ]; then
        EXISTING_TTL=$(echo "$EXISTING_RECORD" | jq -r '.[0].TTL // 300')
        ACTION="UPSERT"
        echo "   Updating existing record..."
    else
        EXISTING_TTL=300
        ACTION="CREATE"
        echo "   Creating new record..."
    fi
    
    # Create change batch
    CHANGE_BATCH=$(jq -n \
        --arg action "$ACTION" \
        --arg name "spotsave.pandeylabs.com." \
        --arg value "$CLOUDFRONT_VALUE" \
        --argjson ttl $EXISTING_TTL \
        '{
            "Changes": [{
                "Action": $action,
                "ResourceRecordSet": {
                    "Name": $name,
                    "Type": "CNAME",
                    "TTL": $ttl,
                    "ResourceRecords": [{"Value": $value}]
                }
            }]
        }')
    
    # Apply change
    CHANGE_OUTPUT=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "$CHANGE_BATCH" \
        --output json)
    
    CHANGE_ID=$(echo "$CHANGE_OUTPUT" | jq -r '.ChangeInfo.Id')
    CHANGE_STATUS=$(echo "$CHANGE_OUTPUT" | jq -r '.ChangeInfo.Status')
    
    echo "✅ Route53 record $ACTION completed"
    echo "   Change ID: $CHANGE_ID"
    echo "   Status: $CHANGE_STATUS"
else
    echo "⚠️  Could not determine CloudFront domain value"
    echo "   Please manually update Route53 with the CloudFront domain from Amplify Console"
fi

echo ""
echo "✅ Deployment Configuration Complete!"
echo ""
echo "📊 Summary:"
echo "   App ID: $APP_ID"
echo "   App Name: $APP_NAME"
echo "   Domain: https://$DOMAIN"
echo "   Region: $REGION"
echo ""
echo "⏳ Next Steps:"
echo "   1. Wait for build to complete (check AWS Console)"
echo "   2. Wait for SSL certificate validation (10-30 minutes)"
echo "   3. Wait for DNS propagation (5-15 minutes)"
echo "   4. Test: https://$DOMAIN"
echo ""
echo "🔍 Monitor Progress:"
echo "   App Status: aws amplify get-app --app-id $APP_ID --region $REGION"
echo "   Domain Status: aws amplify get-domain-association --app-id $APP_ID --domain-name $DOMAIN --region $REGION"
echo "   Build Status: aws amplify list-jobs --app-id $APP_ID --branch-name main --region $REGION"
echo ""
echo "🌐 AWS Console Links:"
echo "   Amplify: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo "   Route53: https://console.aws.amazon.com/route53/v2/hostedzones#ListRecordSets/$HOSTED_ZONE_ID"

