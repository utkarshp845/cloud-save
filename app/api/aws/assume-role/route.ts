import { NextRequest, NextResponse } from "next/server";
import { assumeRole, InvalidRoleError, PermissionDeniedError } from "@/lib/aws/sts";
import { validateExternalId, sanitizeExternalId } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleArn, externalId } = body;

    // Validate inputs
    if (!roleArn || typeof roleArn !== "string") {
      return NextResponse.json(
        { error: "Role ARN is required" },
        { status: 400 }
      );
    }

    if (!externalId || typeof externalId !== "string") {
      return NextResponse.json(
        { error: "External ID is required" },
        { status: 400 }
      );
    }

    // Validate and sanitize external ID
    const sanitizedExternalId = sanitizeExternalId(externalId);
    if (!validateExternalId(sanitizedExternalId)) {
      return NextResponse.json(
        { error: "Invalid external ID format. Must be alphanumeric with hyphens/underscores, 2-1224 characters." },
        { status: 400 }
      );
    }

    // Assume the role
    const credentials = await assumeRole({
      roleArn: roleArn.trim(),
      externalId: sanitizedExternalId,
    });

    return NextResponse.json({
      credentials,
      message: "Successfully assumed role",
    });
  } catch (error) {
    if (error instanceof InvalidRoleError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    console.error("Error assuming role:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to assume role",
      },
      { status: 500 }
    );
  }
}

