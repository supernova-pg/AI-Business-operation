import { prisma } from '@/core/database/prisma'
import { Prisma } from '@prisma/client'

export class TaskRepository {
  static async create(data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({ data })
  }

  static async findById(id: string, tenantId: string) {
    return prisma.task.findFirst({
      where: { id, tenantId, deletedAt: null }
    })
  }

  static async findAllByTenant(tenantId: string) {
    return prisma.task.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { dueDate: 'asc' }
    })
  }

  static async softDelete(id: string, tenantId: string) {
    return prisma.task.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    })
  }
}
