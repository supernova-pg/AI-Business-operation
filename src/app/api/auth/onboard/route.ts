import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/core/security/jwt'
import { setAuthCookies } from '@/core/security/cookies'
import { AuthService } from '@/features/auth/services/auth.service'
import { z } from 'zod'

const OnboardSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
})

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyAccessToken(token)
    if (!payload || !payload.userId || !payload.tokenId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.tenantId) {
      return NextResponse.json({ error: 'User is already onboarded' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = OnboardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { companyName } = parsed.data

    // We assume tokenVersion is fetched from the refresh token or we just issue a new one.
    // Wait, onboardUser needs the currentTokenVersion to sign the new refresh token.
    // We can extract it from the refresh token cookie.
    const refreshToken = req.cookies.get('refresh_token')?.value
    if (!refreshToken) return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    
    // Instead of verifying the refresh token fully again, let's just use AuthService logic,
    // actually, onboardUser can just use the provided tokenId and fetch the current version.
    // I'll adjust the route here to fetch the refresh token version.
    const { verifyRefreshToken } = await import('@/core/security/jwt')
    const refreshPayload = await verifyRefreshToken(refreshToken)
    if (!refreshPayload) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { tenant, accessToken, refreshToken: newRefreshToken } = await AuthService.onboardUser(
      payload.userId,
      payload.email,
      companyName,
      payload.tokenId,
      refreshPayload.tokenVersion!
    )

    const response = NextResponse.json({ success: true, tenant })
    return setAuthCookies(response, accessToken, newRefreshToken)

  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
