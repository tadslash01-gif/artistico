interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory rate limiter (resets on function cold start — acceptable for basic protection)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Default configs for read vs write operations
export const RATE_LIMIT_READ: RateLimitConfig = { maxRequests: 100, windowMs: 15 * 60_000 };
export const RATE_LIMIT_WRITE: RateLimitConfig = { maxRequests: 20, windowMs: 15 * 60_000 };

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_READ
): boolean {
  const now = Date.now();
  const entry = requestCounts.get(identifier);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}
