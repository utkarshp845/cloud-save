import { NextRequest, NextResponse } from "next/server";
import type { CostExplorerResponse, RecommendationsResponse } from "@/types/aws";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { costData, recommendationsData } = body;

    if (!costData || !recommendationsData) {
      return NextResponse.json(
        { error: "Cost data and recommendations are required" },
        { status: 400 }
      );
    }

    const costDataTyped = costData as CostExplorerResponse;
    const recommendationsDataTyped = recommendationsData as RecommendationsResponse;

    // Generate CSV
    const csvRows: string[] = [];

    // Header
    csvRows.push("Type,Date,Service,Cost,Description");

    // Cost data
    costDataTyped.monthlyCosts.forEach((cost) => {
      csvRows.push(`Cost,${cost.month},Total,${cost.amount.toFixed(2)},Monthly cost`);
    });

    // Service breakdown
    costDataTyped.serviceBreakdown.forEach((service) => {
      csvRows.push(`Service,${costDataTyped.monthlyCosts[0]?.month || ""},${service.service},${service.amount.toFixed(2)},${service.percentage.toFixed(2)}% of total`);
    });

    // Recommendations
    recommendationsDataTyped.recommendations.forEach((rec) => {
      csvRows.push(`Recommendation,,${rec.service},${rec.potentialSavings.toFixed(2)},${rec.title} - ${rec.description}`);
    });

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="spotsave-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating export:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate export",
      },
      { status: 500 }
    );
  }
}

