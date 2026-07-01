import { PrismaClient } from '@prisma/client'

// Fix #9: Cache the extended client, not the base, to prevent double-wrapping on hot reloads.
type ExtendedPrismaClient = ReturnType<typeof buildPrismaClient>

function buildPrismaClient() {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async findMany({ args, query }: any) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        async findFirst({ args, query }: any) {
          args.where = { ...args.where, deletedAt: null }
          return query(args)
        },
        // findUnique cannot be intercepted for deletedAt because it requires a unique-key where.
        // Repositories must use findFirst for soft-deleted entity lookups.
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient }

export const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? buildPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
