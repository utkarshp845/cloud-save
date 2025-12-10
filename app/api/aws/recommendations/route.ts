import { NextRequest, NextResponse } from "next/server";
import { getRightsizingRecommendations } from "@/lib/aws/cost-explorer";
import type { AWSCredentials } from "@/types/aws";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentials } = body;

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

    const recommendationsData = await getRightsizingRecommendations(awsCredentials);

    return NextResponse.json(recommendationsData);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch recommendations",
      },
      { status: 500 }
    );
  }
}

