import { getGoogleTokens, getGoogleUserInfo } from '@/core/security/oauth'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/core/security/jwt'
import { UserRepository } from '../repositories/user.repository'
import { RefreshTokenRepository } from '../repositories/refresh-token.repository'
import { AppError } from '@/core/errors/AppError'
import { logger } from '@/core/logger/logger'
import { prisma } from '@/core/database/prisma'

class OAuthProviderService {
  static async resolveUserInfo(code: string, codeVerifier: string) {
    const tokens = await getGoogleTokens(code, codeVerifier)
    return getGoogleUserInfo(tokens.access_token)
  }
}

export class AuthService {
  /**
   * Helper to generate Access and Refresh JWTs from user & session data.
   */
  private static async generateTokens(user: { id: string; email: string; tenantId: string | null; role: string }, tokenId: string, tokenVersion: number) {
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      tokenId,
    }

    const accessToken = await signAccessToken(tokenPayload)
    const refreshToken = await signRefreshToken({ ...tokenPayload, tokenVersion })

    return { accessToken, refreshToken }
  }

  static async exchangeOAuthCode(code: string, codeVerifier: string) {
    const userInfo = await OAuthProviderService.resolveUserInfo(code, codeVerifier)

    if (!userInfo.email) {
      throw new AppError('OAuth response did not contain an email', 400)
    }

    // Fix TOCTOU: Use upsert to handle concurrent logins
    const user = await UserRepository.createWithTenantId({
      email: userInfo.email,
      name: userInfo.name ?? null,
      tenantId: null, // New users start with no tenant
      role: 'ADMIN',
    })

    const token = await RefreshTokenRepository.create(user.id)
    const { accessToken, refreshToken } = await this.generateTokens(user, token.id, token.tokenVersion)

    return { user, accessToken, refreshToken }
  }

  static async refreshSession(refreshTokenCookieValue: string) {
    const payload = await verifyRefreshToken(refreshTokenCookieValue)
    if (!payload || !payload.tokenId) {
      throw new AppError('Invalid or expired refresh token', 401)
    }

    // Fix: Multi-device bug -> Lookup specific session via tokenId
    const storedToken = await RefreshTokenRepository.findById(payload.tokenId)

    if (!storedToken) {
      throw new AppError('Session not found', 401)
    }

    if (storedToken.tokenVersion !== payload.tokenVersion) {
      // Reuse detected - revoke ALL sessions for this user
      await RefreshTokenRepository.invalidateAllForUser(payload.userId)
      logger.warn(`RTR reuse detected for userId: ${payload.userId}. All sessions revoked.`)
      throw new AppError('Token reuse detected, session revoked', 401)
    }

    const updatedToken = await RefreshTokenRepository.updateTokenVersion(
      storedToken.id,
      storedToken.tokenVersion + 1
    )

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.generateTokens(
      { id: payload.userId, email: payload.email, tenantId: payload.tenantId, role: payload.role },
      updatedToken.id,
      updatedToken.tokenVersion
    )

    return { newAccessToken, newRefreshToken }
  }

  static async onboardUser(userId: string, email: string, companyName: string, currentTokenId: string, currentTokenVersion: number) {
    const domain = email.split('@')[1]

    // Fix TOCTOU: use upsert for tenant creation
    const tenant = await prisma.$transaction(async (tx) => {
      const existingTenant = await tx.tenant.upsert({
        where: { domain },
        update: {},
        create: {
          name: companyName,
          domain
        }
      })

      await tx.user.update({
        where: { id: userId },
        data: { tenantId: existingTenant.id }
      })

      return existingTenant
    })

    const { accessToken, refreshToken } = await this.generateTokens(
      { id: userId, email, tenantId: tenant.id, role: 'ADMIN' },
      currentTokenId,
      currentTokenVersion
    )

    return { tenant, accessToken, refreshToken }
  }

  static async logout(userId: string) {
    await RefreshTokenRepository.invalidateAllForUser(userId)
    logger.info(`User logged out, sessions invalidated for userId: ${userId}`)
  }
}
