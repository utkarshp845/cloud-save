#!/bin/bash

# Domain Configuration Script
# Run this AFTER the Amplify app is created (either via console or CLI)

set -e

APP_NAME="spotsave"
DOMAIN="spotsave.pandeylabs.com"
REGION="us-east-1"

echo "🌐 SpotSave Domain Configuration"
echo "================================"
echo ""

# Get app ID
APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
    echo "❌ Amplify app '$APP_NAME' not found"
    echo ""
    echo "Please create the app first:"
    echo "1. Go to: https://console.aws.amazon.com/amplify/home?region=$REGION"
    echo "2. Create app with repository: https://github.com/utkarshp845/cloud-save.git"
    echo "3. Then run this script again"
    exit 1
fi

echo "✅ Found app: $APP_ID"
echo ""

# Configure domain
echo "🌐 Configuring domain: $DOMAIN"

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
    sleep 5
else
    echo "✅ Domain already associated"
fi

# Get domain info
echo "   Fetching domain details..."
DOMAIN_INFO=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN" \
    --region $REGION \
    --output json)

CLOUDFRONT_DOMAIN=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.subDomains[0].dnsRecord' 2>/dev/null || echo "")

if [ -z "$CLOUDFRONT_DOMAIN" ] || [ "$CLOUDFRONT_DOMAIN" == "null" ]; then
    echo "⚠️  CloudFront domain not available yet"
    echo "   Domain info:"
    echo "$DOMAIN_INFO" | jq '.domainAssociation | {status: .domainStatus, subDomains: .subDomains}' 2>/dev/null || echo "$DOMAIN_INFO"
    echo ""
    echo "   Please wait a few minutes and check AWS Console"
    exit 0
fi

echo "✅ CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo ""

# Update Route53
echo "🗺️  Updating Route53 records..."

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
    --query "HostedZones[?Name=='pandeylabs.com.'].Id" \
    --output text | sed 's|/hostedzone/||' | head -1)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "❌ Hosted zone for 'pandeylabs.com' not found"
    exit 1
fi

echo "   Hosted zone: $HOSTED_ZONE_ID"

# Check existing record
EXISTING_RECORD=$(aws route53 list-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --query "ResourceRecordSets[?Name=='spotsave.pandeylabs.com.']" \
    --output json)

if [ "$EXISTING_RECORD" != "[]" ] && [ -n "$EXISTING_RECORD" ]; then
    TTL=$(echo "$EXISTING_RECORD" | jq -r '.[0].TTL // 300')
    ACTION="UPSERT"
    echo "   Updating existing record..."
else
    TTL=300
    ACTION="CREATE"
    echo "   Creating new record..."
fi

# Create change batch
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
echo ""

echo "✅ Domain Configuration Complete!"
echo ""
echo "📊 Summary:"
echo "   App ID: $APP_ID"
echo "   Domain: https://$DOMAIN"
echo "   CloudFront: $CLOUDFRONT_DOMAIN"
echo "   Route53: Updated"
echo ""
echo "⏳ Next Steps:"
echo "   1. Wait for SSL certificate (10-30 minutes)"
echo "   2. Wait for DNS propagation (5-15 minutes)"
echo "   3. Test: https://$DOMAIN"
echo ""
echo "🔍 Monitor:"
echo "   aws amplify get-domain-association --app-id $APP_ID --domain-name $DOMAIN --region $REGION"

