import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export interface ContactQueryParams {
  tenantId: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class ContactRepository {
  static async create(data: Prisma.ContactUncheckedCreateInput) {
    return prisma.contact.create({ data })
  }

  static async findById(id: string, tenantId: string) {
    return prisma.contact.findFirst({
      where: { id, tenantId },
    })
  }

  static async findAll(params: ContactQueryParams) {
    const { tenantId, search, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = params
    
    const where: Prisma.ContactWhereInput = {
      tenantId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ]
      })
    }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where })
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  static async update(id: string, tenantId: string, data: Prisma.ContactUpdateInput) {
    return prisma.contact.updateMany({
      where: { id, tenantId },
      data,
    })
  }

  static async softDelete(id: string, tenantId: string) {
    return prisma.contact.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    })
  }
}
