"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { ServiceBreakdownChart } from "@/components/dashboard/ServiceBreakdownChart";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { SavingsCard } from "@/components/dashboard/SavingsCard";
import { RecommendationsList } from "@/components/dashboard/RecommendationsList";
import { useAWSStore } from "@/lib/store/aws-store";
import { isMockMode, getMockCostData, getMockForecastData, getMockRecommendations } from "@/lib/mock-data";
import type { CostExplorerResponse, ForecastResponse, RecommendationsResponse } from "@/types/aws";

async function fetchCostData(credentials: any): Promise<CostExplorerResponse> {
  if (isMockMode() || !credentials) {
    return getMockCostData();
  }

  const response = await fetch("/api/aws/costs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cost data");
  }

  return response.json();
}

async function fetchForecastData(credentials: any): Promise<ForecastResponse> {
  if (isMockMode() || !credentials) {
    return getMockForecastData();
  }

  const response = await fetch("/api/aws/forecast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch forecast data");
  }

  return response.json();
}

async function fetchRecommendations(credentials: any): Promise<RecommendationsResponse> {
  if (isMockMode() || !credentials) {
    return getMockRecommendations();
  }

  const response = await fetch("/api/aws/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return response.json();
}

function DashboardContent() {
  const router = useRouter();
  const { credentials, isConnected, setCostData, setForecastData, setRecommendationsData } = useAWSStore();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [costData, setLocalCostData] = React.useState<CostExplorerResponse | null>(null);
  const [forecastData, setLocalForecastData] = React.useState<ForecastResponse | null>(null);
  const [recommendationsData, setLocalRecommendationsData] = React.useState<RecommendationsResponse | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [costs, forecast, recommendations] = await Promise.all([
        fetchCostData(credentials),
        fetchForecastData(credentials),
        fetchRecommendations(credentials),
      ]);

      setLocalCostData(costs);
      setLocalForecastData(forecast);
      setLocalRecommendationsData(recommendations);
      setCostData(costs);
      setForecastData(forecast);
      setRecommendationsData(recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [credentials, setCostData, setForecastData, setRecommendationsData]);

  React.useEffect(() => {
    if (!isConnected && !isMockMode()) {
      router.push("/connect");
      return;
    }
    loadData();
  }, [isConnected, router, loadData]);

  const handleExport = () => {
    if (!costData || !recommendationsData) return;

    const csv = [
      ["Date", "Service", "Cost", "Recommendations"].join(","),
      ...costData.monthlyCosts.map((cost) =>
        [cost.month, "Total", cost.amount.toFixed(2), ""].join(",")
      ),
      ...recommendationsData.recommendations.map((rec) =>
        ["", rec.service, "", rec.title].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spotsave-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!costData || !forecastData || !recommendationsData) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Dashboard</h1>
          <p className="text-muted-foreground">
            Total spending: ${costData.totalCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {costData.currency}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SavingsCard totalPotentialSavings={recommendationsData.totalPotentialSavings} />
        <Card>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${costData.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Service</CardTitle>
            <CardDescription>Highest spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {costData.serviceBreakdown[0]?.service.replace("Amazon ", "").replace("AWS ", "") || "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">
              ${costData.serviceBreakdown[0]?.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CostTrendChart data={costData.monthlyCosts} />
        <ServiceBreakdownChart data={costData.serviceBreakdown} />
      </div>

      <ForecastChart data={forecastData} />

      <RecommendationsList recommendations={recommendationsData.recommendations} />
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}

