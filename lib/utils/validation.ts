import { validateRoleArn, extractAccountIdFromArn } from "@/lib/aws/policies";

/**
 * Validate AWS Account ID (12 digits)
 */
export function validateAccountId(accountId: string): boolean {
  return /^\d{12}$/.test(accountId.trim());
}

/**
 * Validate and sanitize external ID
 * External ID should be alphanumeric, hyphens, underscores, and between 2-1224 characters
 */
export function validateExternalId(externalId: string): boolean {
  const trimmed = externalId.trim();
  return /^[a-zA-Z0-9\-_]{2,1224}$/.test(trimmed);
}

/**
 * Sanitize external ID (remove whitespace, validate format)
 */
export function sanitizeExternalId(externalId: string): string {
  return externalId.trim();
}

/**
 * Validate role ARN using policy utility
 */
export function validateRoleArnFormat(roleArn: string): boolean {
  return validateRoleArn(roleArn);
}

/**
 * Extract account ID from role ARN
 */
export function getAccountIdFromArn(roleArn: string): string | null {
  return extractAccountIdFromArn(roleArn);
}

