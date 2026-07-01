/**
 * In-memory sliding window rate limiter.
 * Suitable for single-node deployments (Next.js serverless/edge).
 * For multi-node horizontal scaling, swap with Redis-backed implementation.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent memory leaks (every 60s)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export const RATE_LIMITS = {
  /** General API endpoints */
  api: { maxRequests: 100, windowMs: 60_000 } as RateLimitConfig,
  /** Auth endpoints (login, token refresh) — stricter */
  auth: { maxRequests: 10, windowMs: 60_000 } as RateLimitConfig,
  /** AI chat endpoints — moderate */
  ai: { maxRequests: 20, windowMs: 60_000 } as RateLimitConfig,
}

/**
 * Check if a request should be rate limited.
 * @returns `{ limited: false }` if allowed, `{ limited: true, retryAfterMs }` if blocked.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { limited: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // First request in window or window expired
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { limited: false }
  }

  if (entry.count >= config.maxRequests) {
    return { limited: true, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { limited: false }
}
