import type {
  CostExplorerResponse,
  ForecastResponse,
  RecommendationsResponse,
  MonthlyCost,
  ServiceCost,
  Recommendation,
} from "@/types/aws";

/**
 * Generate mock cost data for development/testing
 */
export function getMockCostData(): CostExplorerResponse {
  const now = new Date();
  const monthlyCosts: MonthlyCost[] = [];
  const services = [
    "Amazon Elastic Compute Cloud - Compute",
    "Amazon Simple Storage Service",
    "Amazon Relational Database Service",
    "Amazon CloudFront",
    "AWS Lambda",
    "Amazon Elasticsearch Service",
    "Amazon EC2 Container Service",
    "Amazon Route 53",
    "Amazon CloudWatch",
    "AWS Data Transfer",
  ];

  // Generate 12 months of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = date.toISOString().split("T")[0].substring(0, 7);
    const baseAmount = 5000 + Math.random() * 2000;
    monthlyCosts.push({
      month,
      amount: Math.round(baseAmount * 100) / 100,
      currency: "USD",
    });
  }

  // Generate service breakdown
  const totalCost = monthlyCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const serviceBreakdown: ServiceCost[] = services.map((service, index) => {
    const percentage = (15 - index * 1.2) + Math.random() * 5;
    const amount = (totalCost * percentage) / 100;
    return {
      service,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  });

  // Normalize percentages
  const totalPercentage = serviceBreakdown.reduce((sum, s) => sum + s.percentage, 0);
  serviceBreakdown.forEach((service) => {
    service.percentage = (service.percentage / totalPercentage) * 100;
  });

  return {
    monthlyCosts,
    serviceBreakdown: serviceBreakdown.slice(0, 10),
    totalCost: Math.round(totalCost * 100) / 100,
    currency: "USD",
  };
}

/**
 * Generate mock forecast data
 */
export function getMockForecastData(): ForecastResponse {
  const costData = getMockCostData();
  const now = new Date();
  const forecast: Array<{ timePeriod: string; meanValue: string }> = [];

  // Generate 3 months of forecast
  for (let i = 1; i <= 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = date.toISOString().split("T")[0].substring(0, 7);
    const lastMonthCost = costData.monthlyCosts[costData.monthlyCosts.length - 1]?.amount || 5000;
    const forecastAmount = lastMonthCost * (1 + (Math.random() * 0.1 - 0.05)); // ±5% variance
    forecast.push({
      timePeriod: month,
      meanValue: forecastAmount.toFixed(2),
    });
  }

  // Get last 3 months of actual for comparison
  const actual = costData.monthlyCosts.slice(-3);

  return {
    forecast: forecast.map((f) => ({
      timePeriod: f.timePeriod,
      meanValue: f.meanValue,
    })),
    actual,
  };
}

/**
 * Generate mock recommendations
 */
export function getMockRecommendations(): RecommendationsResponse {
  const recommendations: Recommendation[] = [
    {
      id: "rec-1",
      type: "reserved-instance",
      title: "Purchase Reserved Instances for EC2",
      description:
        "You have 15 on-demand EC2 instances that could benefit from Reserved Instances. Potential savings: $450/month",
      potentialSavings: 450,
      service: "EC2",
      priority: "high",
    },
    {
      id: "rec-2",
      type: "rightsizing",
      title: "Rightsize m5.xlarge instances",
      description:
        "10 m5.xlarge instances are underutilized. Consider downsizing to m5.large. Potential savings: $320/month",
      potentialSavings: 320,
      service: "EC2",
      resourceId: "i-1234567890abcdef0",
      priority: "high",
    },
    {
      id: "rec-3",
      type: "idle-resource",
      title: "Terminate idle EBS volumes",
      description:
        "5 EBS volumes have been unattached for over 30 days. Potential savings: $50/month",
      potentialSavings: 50,
      service: "EBS",
      priority: "medium",
    },
    {
      id: "rec-4",
      type: "rightsizing",
      title: "Optimize RDS instance types",
      description:
        "3 db.r5.2xlarge instances show low CPU utilization. Consider db.r5.xlarge. Potential savings: $180/month",
      potentialSavings: 180,
      service: "RDS",
      priority: "medium",
    },
    {
      id: "rec-5",
      type: "idle-resource",
      title: "Clean up unused S3 buckets",
      description:
        "2 S3 buckets have been empty for 60+ days. Potential savings: $5/month",
      potentialSavings: 5,
      service: "S3",
      priority: "low",
    },
    {
      id: "rec-6",
      type: "reserved-instance",
      title: "Purchase Savings Plans for Lambda",
      description:
        "Your Lambda usage is consistent. Consider Savings Plans for 20% savings. Potential savings: $120/month",
      potentialSavings: 120,
      service: "Lambda",
      priority: "medium",
    },
  ];

  const totalPotentialSavings = recommendations.reduce(
    (sum, rec) => sum + rec.potentialSavings,
    0
  );

  return {
    recommendations,
    totalPotentialSavings,
  };
}

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem("MOCK_AWS") === "true";
  }
  return process.env.MOCK_AWS === "true" || process.env.NODE_ENV === "development";
}

