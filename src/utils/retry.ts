import { RETRY_CONFIG } from "../constants";

export class RetryError extends Error {
  constructor(message: string, public attempts: number) {
    super(message);
    this.name = "RetryError";
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
  initialDelay: number = RETRY_CONFIG.RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a 4xx error
      if (
        error instanceof Error &&
        error.message.includes("4")
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new RetryError(
    `Failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
    maxRetries + 1
  );
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateAwbNumber(): string {
  return `AWB${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
