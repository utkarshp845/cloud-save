import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { validateRoleArn } from "@/lib/aws/policies";
import type { AWSCredentials } from "@/types/aws";

export class InvalidRoleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRoleError";
  }
}

export class ExpiredCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpiredCredentialsError";
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export interface AssumeRoleParams {
  roleArn: string;
  externalId: string;
  sessionName?: string;
  durationSeconds?: number;
}

/**
 * Assume an IAM role using STS and return temporary credentials
 */
export async function assumeRole({
  roleArn,
  externalId,
  sessionName = "SpotSaveSession",
  durationSeconds = 1800, // 30 minutes
}: AssumeRoleParams): Promise<AWSCredentials> {
  // Validate role ARN format
  if (!validateRoleArn(roleArn)) {
    throw new InvalidRoleError(
      `Invalid role ARN format: ${roleArn}. Expected format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME`
    );
  }

  // Create STS client (uses default credentials from environment or IAM role)
  const stsClient = new STSClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  try {
    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: sessionName,
      ExternalId: externalId,
      DurationSeconds: durationSeconds,
    });

    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error("No credentials returned from STS");
    }

    const credentials = response.Credentials;

    return {
      accessKeyId: credentials.AccessKeyId || "",
      secretAccessKey: credentials.SecretAccessKey || "",
      sessionToken: credentials.SessionToken || "",
      expiration: credentials.Expiration
        ? Math.floor(credentials.Expiration.getTime() / 1000)
        : Math.floor(Date.now() / 1000) + durationSeconds,
    };
  } catch (error) {
    if (error instanceof InvalidRoleError) {
      throw error;
    }

    // Handle specific AWS errors
    if (error instanceof Error) {
      if (error.name === "AccessDenied" || error.message.includes("AccessDenied")) {
        throw new PermissionDeniedError(
          `Access denied. Please verify the role ARN and external ID are correct, and that the trust policy allows this application to assume the role.`
        );
      }

      if (error.message.includes("InvalidUserID.NotFound")) {
        throw new InvalidRoleError(
          `Role not found: ${roleArn}. Please verify the role exists in your AWS account.`
        );
      }

      if (error.message.includes("ExternalId")) {
        throw new PermissionDeniedError(
          `Invalid external ID. Please verify the external ID matches the one configured in the role's trust policy.`
        );
      }
    }

    throw new Error(
      `Failed to assume role: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if credentials are expired or will expire soon
 */
export function areCredentialsExpired(credentials: AWSCredentials, bufferMinutes = 5): boolean {
  const expirationTime = credentials.expiration * 1000; // Convert to milliseconds
  const bufferTime = bufferMinutes * 60 * 1000;
  return Date.now() >= expirationTime - bufferTime;
}

