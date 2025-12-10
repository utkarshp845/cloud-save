#!/bin/bash

# SpotSave Amplify Deployment Script
# Handles GitHub OAuth setup and app creation

set -e

APP_NAME="spotsave"
DOMAIN="spotsave.pandeylabs.com"
REPO_URL="https://github.com/utkarshp845/cloud-save.git"
REGION="us-east-1"

echo "🚀 SpotSave Amplify Deployment"
echo "=============================="
echo ""

# Check if app exists
APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "📱 Creating Amplify app..."
    echo ""
    echo "⚠️  IMPORTANT: GitHub OAuth must be configured first!"
    echo ""
    echo "To set up GitHub OAuth:"
    echo "1. Go to: https://console.aws.amazon.com/amplify/home?region=$REGION"
    echo "2. Click 'New app' → 'Host web app'"
    echo "3. Select 'GitHub'"
    echo "4. Authorize AWS Amplify to access your GitHub account"
    echo "5. After authorization, come back and run this script again"
    echo ""
    echo "OR, if OAuth is already set up, we'll create the app now..."
    echo ""
    read -p "Continue with app creation? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    # Try to create app - this will fail if OAuth isn't set up
    echo "   Attempting to create app..."
    CREATE_OUTPUT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --region $REGION \
        --repository "$REPO_URL" \
        --platform WEB \
        --environment-variables MOCK_AWS=false \
        --output json 2>&1) || {
        ERROR_MSG=$(echo "$CREATE_OUTPUT" | grep -i "token\|oauth\|authorize" || echo "$CREATE_OUTPUT")
        echo ""
        echo "❌ Error creating app:"
        echo "$ERROR_MSG" | head -10
        echo ""
        echo "💡 This usually means GitHub OAuth needs to be set up."
        echo "   Please:"
        echo "   1. Go to AWS Console → Amplify"
        echo "   2. Connect GitHub (one-time OAuth setup)"
        echo "   3. Re-run this script"
        echo ""
        echo "   Or create the app manually in AWS Console and this script will configure the domain."
        exit 1
    }
    
    APP_ID=$(echo "$CREATE_OUTPUT" | jq -r '.app.appId')
    echo "✅ Amplify app created: $APP_ID"
    
    # Create branch
    echo "   Creating main branch..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "main" \
        --region $REGION \
        --output json > /dev/null 2>&1 || echo "   Branch may already exist"
    
    # Start deployment
    echo "   Starting deployment..."
    JOB_ID=$(aws amplify start-job \
        --app-id "$APP_ID" \
        --branch-name "main" \
        --job-type RELEASE \
        --region $REGION \
        --query 'jobSummary.jobId' \
        --output text 2>&1) || echo "   Deployment will start automatically"
    
    if [ -n "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
        echo "✅ Deployment started. Job ID: $JOB_ID"
    fi
else
    echo "✅ Amplify app already exists: $APP_ID"
fi

echo ""

# Configure domain
echo "🌐 Configuring custom domain: $DOMAIN"

DOMAIN_EXISTS=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json 2>/dev/null || echo "")

if [ -z "$DOMAIN_EXISTS" ] || [ "$DOMAIN_EXISTS" == "null" ]; then
    echo "   Creating domain association..."
    aws amplify create-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$DOMAIN" \
        --region $REGION \
        --sub-domain-settings prefix=,branchName=main \
        --output json > /dev/null
    
    echo "✅ Domain association created"
    
    # Wait a bit for domain to initialize
    sleep 5
    
    # Get domain info
    for i in {1..10}; do
        DOMAIN_INFO=$(aws amplify get-domain-association \
            --app-id "$APP_ID" \
            --domain-name "$DOMAIN" \
            --region $REGION \
            --output json 2>/dev/null || echo "")
        
        if [ -n "$DOMAIN_INFO" ] && [ "$DOMAIN_INFO" != "null" ]; then
            break
        fi
        sleep 2
    done
else
    echo "✅ Domain already associated"
    DOMAIN_INFO=$(aws amplify get-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$DOMAIN" \
        --region $REGION \
        --output json)
fi

# Extract CloudFront domain
CLOUDFRONT_DOMAIN=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.subDomains[0].dnsRecord' 2>/dev/null || echo "")

if [ -z "$CLOUDFRONT_DOMAIN" ] || [ "$CLOUDFRONT_DOMAIN" == "null" ]; then
    echo "⚠️  Could not extract CloudFront domain yet. It may still be initializing."
    echo "   Check AWS Console for the domain details."
else
    echo "✅ CloudFront Domain: $CLOUDFRONT_DOMAIN"
    
    # Update Route53
    echo ""
    echo "🗺️  Updating Route53..."
    
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
        --query "HostedZones[?Name=='pandeylabs.com.'].Id" \
        --output text | sed 's|/hostedzone/||' | head -1)
    
    if [ -n "$HOSTED_ZONE_ID" ]; then
        echo "   Found hosted zone: $HOSTED_ZONE_ID"
        
        # Check existing record
        EXISTING_RECORD=$(aws route53 list-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --query "ResourceRecordSets[?Name=='spotsave.pandeylabs.com.']" \
            --output json)
        
        if [ "$EXISTING_RECORD" != "[]" ] && [ -n "$EXISTING_RECORD" ]; then
            EXISTING_TTL=$(echo "$EXISTING_RECORD" | jq -r '.[0].TTL // 300')
            ACTION="UPSERT"
        else
            EXISTING_TTL=300
            ACTION="CREATE"
        fi
        
        CHANGE_BATCH=$(jq -n \
            --arg action "$ACTION" \
            --arg name "spotsave.pandeylabs.com." \
            --arg value "$CLOUDFRONT_DOMAIN" \
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
        
        CHANGE_OUTPUT=$(aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch "$CHANGE_BATCH" \
            --output json)
        
        CHANGE_ID=$(echo "$CHANGE_OUTPUT" | jq -r '.ChangeInfo.Id')
        echo "✅ Route53 record updated. Change ID: $CHANGE_ID"
    else
        echo "⚠️  Hosted zone for pandeylabs.com not found"
    fi
fi

echo ""
echo "✅ Configuration Complete!"
echo ""
echo "📊 Summary:"
echo "   App ID: $APP_ID"
echo "   Domain: https://$DOMAIN"
echo "   Region: $REGION"
echo ""
echo "🔗 AWS Console:"
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"

