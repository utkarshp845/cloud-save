#!/bin/bash

# SpotSave Deployment Script
# This script helps deploy SpotSave to AWS Amplify

set -e

echo "🚀 SpotSave Deployment Script"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Step 1: Deploy Amplify Backend
echo "📦 Step 1: Deploying Amplify Backend (Cognito)..."
npm run amplify-push

if [ ! -f "amplify_outputs.json" ]; then
    echo "⚠️  Warning: amplify_outputs.json not found. The build may fail."
    echo "   Make sure to commit this file to your repository."
else
    echo "✅ Backend deployed successfully"
fi

echo ""

# Step 2: Check Git status
echo "📝 Step 2: Checking Git repository..."
if [ ! -d ".git" ]; then
    echo "⚠️  Warning: Not a git repository. Initialize with 'git init'"
else
    echo "✅ Git repository found"
    git status
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Commit and push your code to your Git repository"
echo "2. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify"
echo "3. Create a new app and connect your repository"
echo "4. Configure custom domain: spotsave.pandeylabs.com"
echo "5. Update Route53 records as shown in Amplify Console"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."

