import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export class AuditLogRepository {
  static async create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data })
  }

  static async findAllByTenant(tenantId: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  static async findAllByEntity(tenantId: string, entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { tenantId, entityType, entityId },
      orderBy: { createdAt: 'desc' }
    })
  }
}
