import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/features/auth/services/auth.service'
import { AppError } from '@/core/errors/AppError'
import { setAuthCookies, clearAuthCookies } from '@/core/security/cookies'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is missing' }, { status: 401 })
    }

    const { newAccessToken, newRefreshToken } = await AuthService.refreshSession(refreshToken)

    // Fix #20: Use centralized cookie helper
    const response = NextResponse.json({ success: true })
    return setAuthCookies(response, newAccessToken, newRefreshToken)
  } catch (error: unknown) {
    if (error instanceof AppError) {
      const response = NextResponse.json({ error: error.message }, { status: error.statusCode })
      // Clear cookies if a session-revocation error occurred
      if (error.message.includes('revoked')) {
        return clearAuthCookies(response)
      }
      return response
    }
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
  }
}
