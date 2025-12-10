#!/bin/bash

# Final SpotSave Deployment Script (Non-Interactive)
# This script creates the Amplify app and configures everything

set -e

APP_NAME="spotsave"
DOMAIN="spotsave.pandeylabs.com"
REPO_URL="https://github.com/utkarshp845/cloud-save.git"
REGION="us-east-1"

echo "🚀 SpotSave Deployment via AWS CLI"
echo "==================================="
echo ""

# Check if app exists
APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "📱 Step 1: Creating Amplify app..."
    
    # Try to create app
    CREATE_OUTPUT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --region $REGION \
        --repository "$REPO_URL" \
        --platform WEB \
        --environment-variables MOCK_AWS=false \
        --output json 2>&1) || {
        
        if echo "$CREATE_OUTPUT" | grep -qi "token\|oauth"; then
            echo ""
            echo "❌ GitHub OAuth not configured"
            echo ""
            echo "📋 To fix this, you need to set up GitHub OAuth in AWS Console:"
            echo ""
            echo "   1. Open: https://console.aws.amazon.com/amplify/home?region=$REGION"
            echo "   2. Click 'New app' → 'Host web app'"
            echo "   3. Select 'GitHub' and authorize"
            echo "   4. After authorization, you can either:"
            echo "      a) Complete app creation in the console, OR"
            echo "      b) Re-run this script: ./deploy-final.sh"
            echo ""
            echo "   The app will be created with these settings:"
            echo "   - Name: $APP_NAME"
            echo "   - Repository: $REPO_URL"
            echo "   - Branch: main"
            echo ""
            exit 1
        else
            echo "❌ Error: $CREATE_OUTPUT"
            exit 1
        fi
    }
    
    APP_ID=$(echo "$CREATE_OUTPUT" | jq -r '.app.appId')
    echo "✅ App created: $APP_ID"
    
    # Create branch and start deployment
    echo "   Creating main branch..."
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name "main" \
        --region $REGION \
        --output json > /dev/null 2>&1 || true
    
    echo "   Starting deployment..."
    aws amplify start-job \
        --app-id "$APP_ID" \
        --branch-name "main" \
        --job-type RELEASE \
        --region $REGION \
        --output json > /dev/null 2>&1 || true
    
    echo "✅ Deployment initiated"
else
    echo "✅ App already exists: $APP_ID"
fi

echo ""

# Configure domain
echo "🌐 Step 2: Configuring domain: $DOMAIN"

DOMAIN_INFO=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json 2>/dev/null || echo "")

if [ -z "$DOMAIN_INFO" ] || [ "$DOMAIN_INFO" == "null" ]; then
    echo "   Creating domain association..."
    aws amplify create-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$DOMAIN" \
        --region $REGION \
        --sub-domain-settings prefix=,branchName=main \
        --output json > /dev/null
    
    echo "✅ Domain association created"
    sleep 3
    
    DOMAIN_INFO=$(aws amplify get-domain-association \
        --app-id "$APP_ID" \
        --domain-name "$DOMAIN" \
        --region $REGION \
        --output json)
fi

CLOUDFRONT_DOMAIN=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.subDomains[0].dnsRecord' 2>/dev/null || echo "")

if [ -n "$CLOUDFRONT_DOMAIN" ] && [ "$CLOUDFRONT_DOMAIN" != "null" ]; then
    echo "✅ CloudFront: $CLOUDFRONT_DOMAIN"
    
    # Update Route53
    echo ""
    echo "🗺️  Step 3: Updating Route53..."
    
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
        --query "HostedZones[?Name=='pandeylabs.com.'].Id" \
        --output text | sed 's|/hostedzone/||' | head -1)
    
    if [ -n "$HOSTED_ZONE_ID" ]; then
        EXISTING_RECORD=$(aws route53 list-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --query "ResourceRecordSets[?Name=='spotsave.pandeylabs.com.']" \
            --output json)
        
        if [ "$EXISTING_RECORD" != "[]" ]; then
            TTL=$(echo "$EXISTING_RECORD" | jq -r '.[0].TTL // 300')
            ACTION="UPSERT"
        else
            TTL=300
            ACTION="CREATE"
        fi
        
        CHANGE_BATCH=$(jq -n \
            --arg action "$ACTION" \
            --arg name "spotsave.pandeylabs.com." \
            --arg value "$CLOUDFRONT_DOMAIN" \
            --argjson ttl $TTL \
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
        
        CHANGE_ID=$(aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch "$CHANGE_BATCH" \
            --query 'ChangeInfo.Id' \
            --output text)
        
        echo "✅ Route53 updated. Change ID: $CHANGE_ID"
    else
        echo "⚠️  Hosted zone not found"
    fi
else
    echo "⚠️  CloudFront domain not available yet. Check AWS Console."
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📊 App Details:"
echo "   App ID: $APP_ID"
echo "   Domain: https://$DOMAIN"
echo "   Console: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo ""
echo "⏳ Next: Wait for build and SSL certificate (10-30 min)"

