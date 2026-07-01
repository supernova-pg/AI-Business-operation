// Fix #20: Cookie configuration is centralized here to prevent duplication across route files.
// Changing cookie policy requires editing exactly one function.
import { NextResponse } from 'next/server'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ACCESS_TOKEN_MAX_AGE = 15 * 60          // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  })

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  })

  return response
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}
