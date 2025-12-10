import { NextRequest, NextResponse } from "next/server";
import { getCostAndUsage } from "@/lib/aws/cost-explorer";
import type { AWSCredentials } from "@/types/aws";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentials, startDate, endDate } = body;

    if (!credentials) {
      return NextResponse.json(
        { error: "Credentials are required" },
        { status: 400 }
      );
    }

    const awsCredentials: AWSCredentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      expiration: credentials.expiration,
    };

    const costData = await getCostAndUsage(awsCredentials, startDate, endDate);

    return NextResponse.json(costData);
  } catch (error) {
    console.error("Error fetching costs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch cost data",
      },
      { status: 500 }
    );
  }
}

