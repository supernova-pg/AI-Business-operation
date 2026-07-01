import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export class SettingsRepository {
  static async upsert(tenantId: string, data: Omit<Prisma.BusinessSettingsCreateInput, 'tenant'>) {
    return prisma.businessSettings.upsert({
      where: { tenantId },
      update: data,
      create: {
        ...data,
        tenant: { connect: { id: tenantId } }
      }
    })
  }

  static async findByTenant(tenantId: string) {
    return prisma.businessSettings.findUnique({
      where: { tenantId }
    })
  }
}
