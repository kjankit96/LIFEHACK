import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function makeAdapter() {
  const url = process.env.TURSO_DATABASE_URL ?? 'file:dev.db'
  const authToken = process.env.TURSO_AUTH_TOKEN
  return new PrismaLibSql({ url, authToken })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: makeAdapter(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
