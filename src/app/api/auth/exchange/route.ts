import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/features/auth/services/auth.service'
import { AppError } from '@/core/errors/AppError'
import { LoginSchema } from '@/core/validation/auth.validation'
import { setAuthCookies } from '@/core/security/cookies'

export async function POST(req: NextRequest) {
  try {
    // Fix #21: Validate request body with Zod before delegating to service.
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { code, codeVerifier } = parsed.data
    const { user, accessToken, refreshToken } = await AuthService.exchangeOAuthCode(code, codeVerifier)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    })

    // Fix #20: Use centralized cookie helper
    return setAuthCookies(response, accessToken, refreshToken)
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const msg = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
