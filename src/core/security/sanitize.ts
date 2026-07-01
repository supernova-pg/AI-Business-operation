/**
 * Input sanitization utilities for XSS and injection protection.
 *
 * NOTE: SQL Injection is inherently prevented by Prisma ORM (parameterized queries)
 * and Mongoose (schema-typed queries). This module provides additional XSS defense
 * for user-facing string inputs.
 */

const HTML_TAG_REGEX = /<[^>]*>/g
const SCRIPT_CONTENT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi

/**
 * Strip HTML tags from a string to prevent stored XSS.
 */
export function stripHtml(input: string): string {
  return input
    .replace(SCRIPT_CONTENT_REGEX, '') // Remove script blocks first
    .replace(HTML_TAG_REGEX, '')        // Then strip remaining tags
    .trim()
}

/**
 * Sanitize an object's string fields recursively.
 * Non-string values are passed through unchanged.
 */
export function sanitizeInput<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = stripHtml(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}
