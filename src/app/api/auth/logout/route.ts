import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/core/security/cookies'
import { verifyAccessToken } from '@/core/security/jwt'
import { AuthService } from '@/features/auth/services/auth.service'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value
  
  if (token) {
    const payload = await verifyAccessToken(token)
    if (payload?.userId) {
      await AuthService.logout(payload.userId)
    }
  }

  const response = NextResponse.json({ success: true })
  return clearAuthCookies(response)
}
