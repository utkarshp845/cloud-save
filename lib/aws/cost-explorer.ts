import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
  GetRightsizingRecommendationCommand,
  type GetCostAndUsageCommandInput,
  type GetCostForecastCommandInput,
  type GetRightsizingRecommendationCommandInput,
} from "@aws-sdk/client-cost-explorer";
import type { AWSCredentials, CostExplorerResponse, ForecastResponse, RecommendationsResponse, MonthlyCost, ServiceCost, Recommendation } from "@/types/aws";

/**
 * Create Cost Explorer client with temporary credentials
 */
function createCostExplorerClient(credentials: AWSCredentials) {
  return new CostExplorerClient({
    region: "us-east-1", // Cost Explorer is only available in us-east-1
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
}

/**
 * Get cost and usage data for the last 12 months
 */
export async function getCostAndUsage(
  credentials: AWSCredentials,
  startDate?: string,
  endDate?: string
): Promise<CostExplorerResponse> {
  const client = createCostExplorerClient(credentials);

  // Default to last 12 months if dates not provided
  const end = endDate || new Date().toISOString().split("T")[0];
  const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const params: GetCostAndUsageCommandInput = {
    TimePeriod: {
      Start: start,
      End: end,
    },
    Granularity: "MONTHLY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      {
        Type: "DIMENSION",
        Key: "SERVICE",
      },
    ],
  };

  try {
    const command = new GetCostAndUsageCommand(params);
    const response = await command;

    const monthlyCosts: MonthlyCost[] = [];
    const serviceMap = new Map<string, number>();

    if (response.ResultsByTime) {
      for (const result of response.ResultsByTime) {
        const timePeriod = result.TimePeriod;
        const month = timePeriod?.Start || "";
        const total = result.Total?.UnblendedCost?.Amount || "0";
        const currency = result.Total?.UnblendedCost?.Unit || "USD";

        monthlyCosts.push({
          month,
          amount: parseFloat(total),
          currency,
        });

        // Aggregate service costs
        if (result.Groups) {
          for (const group of result.Groups) {
            const service = group.Keys?.[0] || "Unknown";
            const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || "0");
            const current = serviceMap.get(service) || 0;
            serviceMap.set(service, current + cost);
          }
        }
      }
    }

    // Calculate total and percentages
    const totalCost = Array.from(serviceMap.values()).reduce((sum, cost) => sum + cost, 0);
    const serviceBreakdown: ServiceCost[] = Array.from(serviceMap.entries())
      .map(([service, amount]) => ({
        service,
        amount,
        percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 services

    // Add "Others" category if there are more services
    const othersAmount = Array.from(serviceMap.values())
      .slice(10)
      .reduce((sum, cost) => sum + cost, 0);
    if (othersAmount > 0) {
      serviceBreakdown.push({
        service: "Others",
        amount: othersAmount,
        percentage: (othersAmount / totalCost) * 100,
      });
    }

    return {
      monthlyCosts,
      serviceBreakdown,
      totalCost,
      currency: monthlyCosts[0]?.currency || "USD",
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch cost data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get cost forecast for the next 3 months
 */
export async function getCostForecast(
  credentials: AWSCredentials,
  startDate?: string,
  endDate?: string
): Promise<ForecastResponse> {
  const client = createCostExplorerClient(credentials);

  const end = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const start = startDate || new Date().toISOString().split("T")[0];

  const params: GetCostForecastCommandInput = {
    TimePeriod: {
      Start: start,
      End: end,
    },
    Metric: "UNBLENDED_COST",
    Granularity: "MONTHLY",
  };

  try {
    const command = new GetCostForecastCommand(params);
    const response = await command;

    const forecast: Array<{ timePeriod: string; meanValue: string }> = [];
    if (response.ForecastResultsByTime) {
      for (const result of response.ForecastResultsByTime) {
        forecast.push({
          timePeriod: result.TimePeriod?.Start || "",
          meanValue: result.MeanValue || "0",
        });
      }
    }

    // Get actual costs for comparison
    const actual = await getCostAndUsage(credentials, start, end);

    return {
      forecast: forecast.map((f) => ({
        timePeriod: f.timePeriod,
        meanValue: f.meanValue,
      })),
      actual: actual.monthlyCosts,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch forecast: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get rightsizing recommendations
 */
export async function getRightsizingRecommendations(
  credentials: AWSCredentials
): Promise<RecommendationsResponse> {
  const client = createCostExplorerClient(credentials);

  const params: GetRightsizingRecommendationCommandInput = {
    Service: "Amazon Elastic Compute Cloud - Compute",
  };

  try {
    const command = new GetRightsizingRecommendationCommand(params);
    const response = await command;

    const recommendations: Recommendation[] = [];

    if (response.RightsizingRecommendations) {
      for (const rec of response.RightsizingRecommendations) {
        const currentCost = parseFloat(rec.CurrentInstance?.MonthlyCost || "0");
        const targetCost = rec.TargetInstances?.[0]
          ? parseFloat(rec.TargetInstances[0].MonthlyCost || "0")
          : currentCost;
        const savings = currentCost - targetCost;

        if (savings > 0) {
          recommendations.push({
            id: rec.AccountId || `rec-${Date.now()}`,
            type: "rightsizing",
            title: `Rightsize ${rec.CurrentInstance?.InstanceName || "Instance"}`,
            description: `Consider downsizing from ${rec.CurrentInstance?.InstanceType} to ${rec.TargetInstances?.[0]?.InstanceType || "smaller instance"}`,
            potentialSavings: savings,
            service: "EC2",
            resourceId: rec.CurrentInstance?.InstanceName,
            priority: savings > 100 ? "high" : savings > 50 ? "medium" : "low",
          });
        }
      }
    }

    const totalPotentialSavings = recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0
    );

    return {
      recommendations,
      totalPotentialSavings,
    };
  } catch (error) {
    // If rightsizing recommendations fail, return empty recommendations
    // This is common if Compute Optimizer is not enabled
    console.warn("Failed to fetch rightsizing recommendations:", error);
    return {
      recommendations: [],
      totalPotentialSavings: 0,
    };
  }
}

