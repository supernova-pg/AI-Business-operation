import { prisma } from '@/core/database/prisma'
import { AppError } from '@/core/errors/AppError'

export class TaskService {
  static async getTasks(tenantId: string) {
    return prisma.task.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async createTask(tenantId: string, data: any) {
    if (!data.title) {
      throw new AppError('Title is required', 400)
    }

    return prisma.task.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        status: data.status || 'TODO',
        contactId: data.contactId,
        opportunityId: data.opportunityId
      }
    })
  }
}
