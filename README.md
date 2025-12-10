# SpotSave - AWS Cost Optimization Tool

SpotSave is a production-ready web application for AWS cost optimization. It provides dashboards with cost savings analysis, trends, and recommendations by connecting to your AWS account via a read-only IAM role.

## Features

- **Authentication**: Secure email/password authentication via AWS Cognito
- **AWS Integration**: Connect your AWS account using IAM role assumption with STS
- **Cost Dashboards**: 
  - 12-month cost trends (line chart)
  - Service breakdown (pie chart)
  - Forecast vs actual comparison (bar chart)
  - Potential savings overview
- **Recommendations**: Rightsizing opportunities, Reserved Instance suggestions, and idle resource identification
- **Export**: Download cost data and recommendations as CSV
- **Dark Mode**: Toggle between light and dark themes
- **Mock Data**: Development mode with sample data when AWS connection is unavailable

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS 4, shadcn/ui components, lucide-react icons
- **Charts**: recharts for data visualization
- **State Management**: Zustand
- **Authentication**: AWS Amplify Gen 2 (Cognito)
- **AWS SDK**: AWS SDK v3 (Cost Explorer, STS)
- **Deployment**: AWS Amplify Hosting

## Prerequisites

- Node.js 18+ and npm
- AWS Account with appropriate permissions
- AWS CLI configured (for Amplify deployment)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SpotSave
```

2. Install dependencies:
```bash
npm install
```

3. Set up Amplify backend:
```bash
npm run amplify-setup
```

This will initialize the Amplify Gen 2 backend and create the Cognito user pool for authentication.

## AWS IAM Role Setup

To connect SpotSave to your AWS account, you need to create an IAM role with read-only access to Cost Explorer.

### Step 1: Create IAM Role

1. Go to AWS IAM Console → Roles → Create Role
2. Select "AWS Account" as the trusted entity type
3. Choose "This account" or "Another AWS account" (if using cross-account access)

### Step 2: Configure Trust Policy

Use the following trust policy template. Replace `YOUR_ACCOUNT_ID` with your 12-digit AWS account ID and `YOUR_EXTERNAL_ID` with a unique external ID (you'll generate this in the app):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "YOUR_EXTERNAL_ID"
        }
      }
    }
  ]
}
```

### Step 3: Attach Permissions Policy

Attach the following permissions policy to your role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostAndUsageWithResources",
        "ce:GetReservationCoverage",
        "ce:GetReservationPurchaseRecommendation",
        "ce:GetReservationUtilization",
        "ce:GetRightsizingRecommendation",
        "ce:GetSavingsPlansCoverage",
        "ce:GetSavingsPlansUtilization",
        "ce:GetSavingsPlansUtilizationDetails",
        "ce:GetUsageReport",
        "ce:ListCostCategoryDefinitions",
        "ce:GetCostForecast",
        "ce:GetUsageForecast",
        "ce:GetDimensionValues",
        "ce:GetTags",
        "ce:DescribeCostCategoryDefinition"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "budgets:ViewBudget",
        "budgets:DescribeBudgets",
        "budgets:DescribeBudgetPerformanceHistory",
        "budgets:DescribeBudgetActionHistories",
        "budgets:DescribeBudgetActionsForAccount",
        "budgets:DescribeBudgetActionsForBudget"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "trustedadvisor:Describe*",
        "trustedadvisor:RefreshCheck",
        "trustedadvisor:ExcludeCheck",
        "trustedadvisor:IncludeCheck"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 4: Name Your Role

Name your role (e.g., `SpotSaveReadOnlyRole`) and complete the creation.

### Step 5: Copy Role ARN

Copy the role ARN (format: `arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME`) - you'll need this in the app.

## Development

### Running Locally

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

3. Sign up for an account or sign in.

4. Navigate to the Connect page (`/connect`) and follow the setup wizard:
   - Step 1: Copy the IAM permissions policy
   - Step 2: Configure the trust policy (you'll need to generate an external ID)
   - Step 3: Enter your AWS Account ID, Role ARN, and External ID, then test the connection

### Mock Data Mode

For development without AWS connection, you can enable mock data mode:

1. Set environment variable:
```bash
export MOCK_AWS=true
```

Or in the browser console:
```javascript
localStorage.setItem('MOCK_AWS', 'true')
```

2. Refresh the page - the dashboard will use mock data.

## Testing with Real AWS Data

1. **Create the IAM role** following the steps above.

2. **Connect in the app**:
   - Go to `/connect`
   - Enter your AWS Account ID (12 digits)
   - Generate or enter the Role ARN
   - Create a unique External ID (alphanumeric, 2-1224 characters)
   - Update the role's trust policy with this External ID
   - Test the connection

3. **Verify data**:
   - Navigate to `/dashboard`
   - The dashboard should display your actual AWS cost data
   - Check that charts render correctly
   - Verify recommendations appear (if available)

4. **Test export**:
   - Click "Export CSV" on the dashboard
   - Verify the downloaded file contains cost data and recommendations

## Deployment

This application is deployed on AWS Amplify. The `amplify.yml` file contains the build configuration.

### Deploy Backend (Amplify Auth)

The Cognito user pool is already configured. The `amplify_outputs.json` file contains the authentication configuration.

### Deploy Frontend

The application is automatically deployed when changes are pushed to the main branch. The build process:
1. Installs dependencies (`npm ci`)
2. Builds the Next.js application (`npm run build`)
3. Deploys to Amplify Hosting

### Environment Variables

- `MOCK_AWS`: Set to `false` in production to use real AWS APIs

## Project Structure

```
SpotSave/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── connect/         # AWS connection wizard
│   │   └── dashboard/       # Main dashboard
│   ├── api/                 # API routes
│   │   ├── aws/             # AWS-related endpoints
│   │   └── export/          # CSV export
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard chart components
│   ├── connect/             # Connection wizard components
│   └── layout/              # Layout components (Header, ThemeToggle)
├── lib/
│   ├── aws/                 # AWS SDK wrappers
│   │   ├── sts.ts           # STS assume-role logic
│   │   ├── cost-explorer.ts # Cost Explorer API calls
│   │   └── policies.ts      # IAM policy templates
│   ├── store/               # Zustand stores
│   │   └── aws-store.ts     # AWS credentials & cost data
│   ├── auth.ts              # Auth helpers
│   ├── mock-data.ts         # Mock data for dev
│   └── utils.ts             # Utility functions
├── amplify/
│   ├── auth/
│   │   └── resource.ts      # Amplify auth config
│   └── backend.ts            # Amplify backend definition
├── types/
│   └── aws.ts               # TypeScript interfaces
└── public/                  # Static assets
```

## Security Considerations

1. **IAM Role**: Uses read-only permissions - SpotSave cannot modify your AWS resources
2. **External ID**: Required for additional security when assuming roles
3. **Temporary Credentials**: Credentials expire after 30 minutes and are auto-refreshed
4. **Server-Side API Calls**: All AWS API calls are made server-side, never exposing credentials to the client
5. **No Credential Storage**: Temporary credentials are stored in Zustand (client-side) but not persisted

## Troubleshooting

### "Access Denied" Error

- Verify the IAM role's trust policy allows your account to assume the role
- Check that the External ID matches exactly
- Ensure the permissions policy is attached to the role

### "Role Not Found" Error

- Verify the Role ARN is correct
- Ensure the role exists in the specified AWS account
- Check that you have permissions to assume the role

### Cost Data Not Loading

- Verify Cost Explorer API is enabled in your AWS account (usually enabled by default)
- Check that the IAM role has the required `ce:*` permissions
- Ensure there is cost data available (may take 24-48 hours after first AWS usage)

### Charts Not Rendering

- Check browser console for errors
- Verify recharts is installed: `npm install recharts`
- Ensure data is in the correct format (check API responses)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.

