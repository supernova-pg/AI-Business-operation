import { prisma } from '@/core/database/prisma'

export class UserRepository {
  static async findByEmail(email: string) {
    // findFirst respects the global soft-delete extension
    return prisma.user.findFirst({ where: { email } })
  }

  // Fix #18: Properly typed. No `as any`. Accepts flat unchecked input to avoid Prisma nested-create complexity.
  static async createWithTenantId(data: {
    email: string
    name: string | null
    tenantId: string | null
    role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER'
  }) {
    // Fix: Prevent TOCTOU race conditions by using upsert instead of find-then-create
    return prisma.user.upsert({
      where: { email: data.email },
      update: {}, // if exists, do nothing (or update name if we want)
      create: data
    })
  }
}
