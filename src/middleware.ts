import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/core/security/jwt'
import { checkRateLimit, RATE_LIMITS } from '@/core/security/rate-limiter'

// Protected routes pattern
const PROTECTED_PREFIXES = ['/dashboard', '/workflows', '/ai', '/settings', '/onboarding']

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApiRoute = pathname.startsWith('/api/')

  // ─── CORS (API routes only) ───
  if (isApiRoute) {
    const origin = req.headers.get('origin') || ''
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin) || !origin // Allow same-origin (no Origin header)

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      const preflightHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id, x-csrf-token',
        'Access-Control-Max-Age': '86400',
      }
      if (isAllowedOrigin && origin) {
        preflightHeaders['Access-Control-Allow-Origin'] = origin
      }
      return new NextResponse(null, { status: 204, headers: preflightHeaders })
    }

    // ─── Rate Limiting ───
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimitConfig = pathname.startsWith('/api/auth')
      ? RATE_LIMITS.auth
      : pathname.startsWith('/api/ai')
        ? RATE_LIMITS.ai
        : RATE_LIMITS.api

    const rateLimitKey = `${clientIp}:${pathname.startsWith('/api/auth') ? 'auth' : pathname.startsWith('/api/ai') ? 'ai' : 'api'}`
    const { limited, retryAfterMs } = checkRateLimit(rateLimitKey, rateLimitConfig)

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((retryAfterMs || 60000) / 1000)) },
        }
      )
    }

    // ─── CSRF Protection (mutating requests) ───
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    const isWebhook = pathname.startsWith('/api/webhook') // Webhooks are exempt from CSRF
    const isAuthCallback = pathname.startsWith('/api/auth') // Auth callbacks are exempt

    if (isMutating && !isWebhook && !isAuthCallback) {
      const requestOrigin = req.headers.get('origin')
      const referer = req.headers.get('referer')

      // Validate that the request originates from our own domain
      if (requestOrigin && !ALLOWED_ORIGINS.includes(requestOrigin)) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
      }

      // If no origin header, fall back to referer check
      if (!requestOrigin && referer) {
        const refererUrl = new URL(referer)
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
        if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
          return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 })
        }
      }
    }
  }

  // ─── Authentication (Protected routes) ───
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isProtected) {
    const accessToken = req.cookies.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Access token expired' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Tenant isolation: redirect to onboarding if no tenant
    if (!payload.tenantId && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    // Role-based Authorization
    const normalizedPath = pathname.startsWith('/api/') ? pathname.replace('/api', '') : pathname

    if (normalizedPath.startsWith('/settings/system') && payload.role !== 'SUPERADMIN') {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (normalizedPath.startsWith('/settings') && !['SUPERADMIN', 'ADMIN'].includes(payload.role)) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Inject tenant/user context headers downstream
    const requestHeaders = new Headers(req.headers)
    if (payload.tenantId) requestHeaders.set('x-tenant-id', payload.tenantId)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)

    const response = NextResponse.next({ request: { headers: requestHeaders } })

    // Attach CORS headers to response
    if (isApiRoute) {
      const origin = req.headers.get('origin') || ''
      if (ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      }
    }

    return response
  }

  // Prevent logged-in users from seeing login/onboarding if already set up
  if (pathname === '/login' || pathname === '/onboarding') {
    const accessToken = req.cookies.get('access_token')?.value
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken)
      if (payload?.tenantId) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  }

  const response = NextResponse.next()

  // Attach CORS headers to API responses for non-protected routes
  if (isApiRoute) {
    const origin = req.headers.get('origin') || ''
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
