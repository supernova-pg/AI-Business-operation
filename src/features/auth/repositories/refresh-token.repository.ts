// Fix #7: Renamed from SessionRepository. All references updated to match the RefreshToken
// model in prisma/schema.prisma. The previous 'Session' model no longer exists.
import { prisma } from '@/core/database/prisma'

export class RefreshTokenRepository {
  static async create(userId: string) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenVersion: 0,
      },
    })
  }

  static async findByUserId(userId: string) {
    // Note: deprecated for session lookup, kept for other utilities
    return prisma.refreshToken.findFirst({
      where: { userId },
    })
  }

  static async findById(id: string) {
    return prisma.refreshToken.findUnique({
      where: { id },
    })
  }

  static async updateTokenVersion(id: string, newVersion: number) {
    return prisma.refreshToken.update({
      where: { id },
      data: { tokenVersion: newVersion },
    })
  }

  static async invalidateAllForUser(userId: string) {
    // Hard delete all refresh tokens for this user (revoke all sessions)
    return prisma.refreshToken.deleteMany({
      where: { userId },
    })
  }
}
