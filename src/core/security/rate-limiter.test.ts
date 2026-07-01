import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, RateLimitConfig } from './rate-limiter'

describe('Rate Limiter', () => {
  const config: RateLimitConfig = { maxRequests: 3, windowMs: 10_000 }

  beforeEach(() => {
    // Reset by using a unique key per test
  })

  it('should allow requests under the limit', () => {
    const key = `test-allow-${Date.now()}`
    expect(checkRateLimit(key, config).limited).toBe(false)
    expect(checkRateLimit(key, config).limited).toBe(false)
    expect(checkRateLimit(key, config).limited).toBe(false)
  })

  it('should block requests over the limit', () => {
    const key = `test-block-${Date.now()}`
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    const result = checkRateLimit(key, config)
    expect(result.limited).toBe(true)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('should use independent windows per key', () => {
    const keyA = `test-indep-a-${Date.now()}`
    const keyB = `test-indep-b-${Date.now()}`

    checkRateLimit(keyA, config)
    checkRateLimit(keyA, config)
    checkRateLimit(keyA, config)

    // keyA is exhausted
    expect(checkRateLimit(keyA, config).limited).toBe(true)
    // keyB should still be fine
    expect(checkRateLimit(keyB, config).limited).toBe(false)
  })
})
