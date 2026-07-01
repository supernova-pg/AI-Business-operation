import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export class OpportunityRepository {
  static async create(data: Prisma.OpportunityUncheckedCreateInput) {
    return prisma.opportunity.create({ data, include: { contact: true } })
  }

  static async findById(id: string, tenantId: string) {
    return prisma.opportunity.findFirst({
      where: { id, tenantId },
      include: { contact: true }
    })
  }

  static async findAllByTenant(tenantId: string) {
    return prisma.opportunity.findMany({
      where: { tenantId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async update(id: string, tenantId: string, data: Prisma.OpportunityUpdateInput) {
    // We use updateMany for tenant safety, then findFirst to return the updated record with relations
    await prisma.opportunity.updateMany({
      where: { id, tenantId },
      data
    })
    return this.findById(id, tenantId)
  }

  static async softDelete(id: string, tenantId: string) {
    return prisma.opportunity.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    })
  }
}
