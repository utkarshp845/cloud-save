/**
 * IAM Policy Templates for SpotSave
 * 
 * These policies define the permissions required for SpotSave to access
 * AWS Cost Explorer and related services in read-only mode.
 */

/**
 * Trust Policy - Allows SpotSave to assume the IAM role
 * 
 * Replace YOUR_ACCOUNT_ID with your AWS account ID
 * Replace YOUR_EXTERNAL_ID with a unique external ID for security
 */
export const getTrustPolicy = (accountId: string, externalId: string): string => {
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            AWS: `arn:aws:iam::${accountId}:root`,
          },
          Action: "sts:AssumeRole",
          Condition: {
            StringEquals: {
              "sts:ExternalId": externalId,
            },
          },
        },
      ],
    },
    null,
    2
  );
};

/**
 * Permissions Policy - Read-only access to Cost Explorer and related services
 */
export const getPermissionsPolicy = (): string => {
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
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
            "ce:DescribeCostCategoryDefinition",
          ],
          Resource: "*",
        },
        {
          Effect: "Allow",
          Action: [
            "budgets:ViewBudget",
            "budgets:DescribeBudgets",
            "budgets:DescribeBudgetPerformanceHistory",
            "budgets:DescribeBudgetActionHistories",
            "budgets:DescribeBudgetActionsForAccount",
            "budgets:DescribeBudgetActionsForBudget",
          ],
          Resource: "*",
        },
        {
          Effect: "Allow",
          Action: [
            "trustedadvisor:Describe*",
            "trustedadvisor:RefreshCheck",
            "trustedadvisor:ExcludeCheck",
            "trustedadvisor:IncludeCheck",
          ],
          Resource: "*",
        },
      ],
    },
    null,
    2
  );
};

/**
 * Complete IAM policy template for copy-paste
 */
export const getCompletePolicyTemplate = (): string => {
  return getPermissionsPolicy();
};

/**
 * Generate role ARN from account ID and role name
 */
export function generateRoleArn(accountId: string, roleName: string = "SpotSaveReadOnlyRole"): string {
  // Validate account ID format (12 digits)
  if (!/^\d{12}$/.test(accountId)) {
    throw new Error("Invalid AWS account ID. Must be 12 digits.");
  }
  return `arn:aws:iam::${accountId}:role/${roleName}`;
}

/**
 * Validate role ARN format
 */
export function validateRoleArn(roleArn: string): boolean {
  const roleArnRegex = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;
  return roleArnRegex.test(roleArn);
}

/**
 * Extract account ID from role ARN
 */
export function extractAccountIdFromArn(roleArn: string): string | null {
  const match = roleArn.match(/^arn:aws:iam::(\d{12}):role\//);
  return match ? match[1] : null;
}

