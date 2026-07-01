import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/core/errors/AppError'
import { logger } from '@/core/logger/logger'
import { sanitizeInput } from '@/core/security/sanitize'
import { z } from 'zod'

type ApiHandler = (req: NextRequest, params?: any) => Promise<NextResponse>

/**
 * Global API Handler Wrapper
 * - Catches AppErrors and generic errors, returning formatted JSON.
 * - Safely parses and sanitizes request bodies (XSS protection).
 */
export function withApiHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, params?: any) => {
    try {
      // Overload req.json() to automatically sanitize payloads
      const originalJson = req.json.bind(req)
      req.json = async () => {
        const body = await originalJson()
        return sanitizeInput(body)
      }

      return await handler(req, params)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.flatten() },
          { status: 400 }
        )
      }
      
      if (error instanceof AppError) {
        if (error.statusCode >= 500) {
          logger.error(`[API] AppError: ${error.message}`, { stack: error.stack })
        }
        return NextResponse.json({ error: error.message }, { status: error.statusCode })
      }

      logger.error(`[API] Unhandled Exception: ${error.message}`, { stack: error.stack })
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
