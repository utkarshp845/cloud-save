import { NextRequest, NextResponse } from "next/server";
import { getCostForecast } from "@/lib/aws/cost-explorer";
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

    const forecastData = await getCostForecast(awsCredentials, startDate, endDate);

    return NextResponse.json(forecastData);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch forecast data",
      },
      { status: 500 }
    );
  }
}

