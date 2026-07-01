import { SignJWT, jwtVerify } from 'jose'

// Lazy-load secrets at request time, not at module import time.
// This prevents the Docker build from crashing when env vars are not yet available.
function getAccessSecret(): Uint8Array {
  const raw = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET
  if (!raw) throw new Error('FATAL: ACCESS_TOKEN_SECRET environment variable is not set.')
  return new TextEncoder().encode(raw)
}

function getRefreshSecret(): Uint8Array {
  const raw = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET
  if (!raw) throw new Error('FATAL: REFRESH_TOKEN_SECRET environment variable is not set.')
  return new TextEncoder().encode(raw)
}

export interface TokenPayload {
  userId: string
  email: string
  tenantId: string | null
  role: string
  tokenId: string // Added to prevent multi-device RTR overwriting bugs
  tokenVersion?: number
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getAccessSecret())
}

export async function signRefreshToken(payload: TokenPayload & { tokenVersion: number }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getRefreshSecret())
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret())
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<(TokenPayload & { tokenVersion: number }) | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret())
    return payload as unknown as TokenPayload & { tokenVersion: number }
  } catch {
    return null
  }
}
