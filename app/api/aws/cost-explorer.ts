/**
 * Retry utility for AWS API calls with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on certain errors
      if (
        lastError.message.includes("AccessDenied") ||
        lastError.message.includes("InvalidRole") ||
        lastError.message.includes("PermissionDenied")
      ) {
        throw lastError;
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

