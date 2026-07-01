import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/core/security/jwt'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value
  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
  }

  const payload = await verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: payload.userId,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role
    }
  })
}
