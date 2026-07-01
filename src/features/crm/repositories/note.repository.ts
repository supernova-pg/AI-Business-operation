import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export class NoteRepository {
  static async create(data: Prisma.NoteUncheckedCreateInput) {
    return prisma.note.create({
      data,
      include: { author: { select: { id: true, name: true, email: true } } }
    })
  }

  static async findByContact(contactId: string, tenantId: string) {
    return prisma.note.findMany({
      where: { contactId, tenantId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async findByOpportunity(opportunityId: string, tenantId: string) {
    return prisma.note.findMany({
      where: { opportunityId, tenantId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }
}
