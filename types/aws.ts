export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: number; // Unix timestamp
}

export interface CostData {
  timePeriod: string;
  total: {
    amount: string;
    unit: string;
  };
  groups?: Array<{
    keys: string[];
    metrics: {
      UnblendedCost: {
        amount: string;
        unit: string;
      };
    };
  }>;
}

export interface MonthlyCost {
  month: string;
  amount: number;
  currency: string;
}

export interface ServiceCost {
  service: string;
  amount: number;
  percentage: number;
}

export interface ForecastData {
  timePeriod: string;
  meanValue: string;
  predictionIntervalLowerBound?: string;
  predictionIntervalUpperBound?: string;
}

export interface RightsizingRecommendation {
  accountId?: string;
  currentInstance?: {
    instanceName?: string;
    instanceType?: string;
    monthlyCost?: string;
  };
  rightsizingType?: string;
  targetInstances?: Array<{
    instanceType?: string;
    monthlyCost?: string;
    estimatedMonthlySavings?: string;
  }>;
}

export interface Recommendation {
  id: string;
  type: "reserved-instance" | "rightsizing" | "idle-resource";
  title: string;
  description: string;
  potentialSavings: number;
  service: string;
  resourceId?: string;
  priority: "high" | "medium" | "low";
}

export interface CostExplorerResponse {
  monthlyCosts: MonthlyCost[];
  serviceBreakdown: ServiceCost[];
  totalCost: number;
  currency: string;
}

export interface ForecastResponse {
  forecast: ForecastData[];
  actual: MonthlyCost[];
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  totalPotentialSavings: number;
}

