import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export class TenantRepository {
  static async create(data: Prisma.TenantCreateInput) {
    return prisma.tenant.create({
      data
    })
  }

  static async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id }
    })
  }

  static async findByDomain(domain: string) {
    return prisma.tenant.findUnique({
      where: { domain }
    })
  }
}
