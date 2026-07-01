import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from './auth.service'
import { UserRepository } from '../repositories/user.repository'
import { RefreshTokenRepository } from '../repositories/refresh-token.repository'
import { OAuthProviderService } from './oauth.service'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/core/security/jwt'
import { AppError } from '@/core/errors/AppError'
import { prisma } from '@/core/database/prisma'

// Mock dependencies
vi.mock('../repositories/user.repository')
vi.mock('../repositories/refresh-token.repository')
vi.mock('./oauth.service')
vi.mock('@/core/security/jwt')
vi.mock('@/core/database/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  }
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exchangeOAuthCode', () => {
    it('should create a new user with no tenant if user does not exist', async () => {
      vi.mocked(OAuthProviderService.exchangeCodeForUserInfo).mockResolvedValue({
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User'
      })
      vi.mocked(UserRepository.findByEmail).mockResolvedValue(null)
      
      const mockNewUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: null,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }
      // @ts-ignore - Mocking Prisma return
      vi.mocked(UserRepository.createWithTenantId).mockResolvedValue(mockNewUser)
      
      vi.mocked(RefreshTokenRepository.findByUserId).mockResolvedValue(null)
      vi.mocked(signAccessToken).mockResolvedValue('mock-access-token')
      vi.mocked(signRefreshToken).mockResolvedValue('mock-refresh-token')

      const result = await AuthService.exchangeOAuthCode('fake-code', 'fake-verifier')

      expect(UserRepository.createWithTenantId).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        tenantId: null,
        role: 'ADMIN'
      })
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.user.tenantId).toBeNull()
    })
  })

  describe('refreshSession', () => {
    it('should throw AppError if refresh token is invalid', async () => {
      vi.mocked(verifyRefreshToken).mockResolvedValue(null)

      await expect(AuthService.refreshSession('invalid-token')).rejects.toThrow(AppError)
      await expect(AuthService.refreshSession('invalid-token')).rejects.toThrow('Invalid or expired refresh token')
    })

    it('should throw AppError if token version does not match (RTR revoked)', async () => {
      vi.mocked(verifyRefreshToken).mockResolvedValue({
        userId: 'user-1',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        role: 'ADMIN',
        tokenVersion: 1
      })

      // DB returns a higher token version, meaning the session was revoked
      vi.mocked(RefreshTokenRepository.findByUserId).mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        tokenVersion: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      })

      await expect(AuthService.refreshSession('old-token')).rejects.toThrow(AppError)
      await expect(AuthService.refreshSession('old-token')).rejects.toThrow('Session has been revoked')
    })
  })

  describe('onboardUser', () => {
    it('should create tenant and link user, then return new tokens', async () => {
      // @ts-ignore
      vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
        // mock tx
        return cb({
          tenant: { upsert: vi.fn().mockResolvedValue({ id: 'tenant-new', domain: 'example.com' }) },
          user: { update: vi.fn().mockResolvedValue({}) }
        })
      })

      vi.mocked(signAccessToken).mockResolvedValue('new-access-token')
      vi.mocked(signRefreshToken).mockResolvedValue('new-refresh-token')

      const result = await AuthService.onboardUser('user-1', 'test@example.com', 'Example Inc', 'token-id-1', 1)

      expect(result.tenant.id).toBe('tenant-new')
      expect(result.accessToken).toBe('new-access-token')
      expect(result.refreshToken).toBe('new-refresh-token')
      expect(signRefreshToken).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-new',
        tokenVersion: 1
      }))
    })
  })

  describe('logout', () => {
    it('should invalidate all sessions for a user', async () => {
      await AuthService.logout('user-123')
      expect(RefreshTokenRepository.invalidateAllForUser).toHaveBeenCalledWith('user-123')
    })
  })
})
