import { PrismaClient } from '@prisma/client';
import { sqliteAdapter } from './prisma-adapter';

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter: sqliteAdapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
