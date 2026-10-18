import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// singleton imported

export class ExerciseRepository {
  async findAll(userId?: string, query?: string) {
    const ownershipFilter: Prisma.ExerciseWhereInput = userId
      ? {
          OR: [
            { is_custom: false },
            { created_by_user_id: userId },
          ],
        }
      : { is_custom: false };

    if (query) {
      return prisma.exercise.findMany({
        where: {
          AND: [
            { name: { contains: query } },
            ownershipFilter,
          ],
        },
      });
    }
    return prisma.exercise.findMany({
      where: ownershipFilter,
    });
  }

  async findById(id: string, userId?: string) {
    const ex = await prisma.exercise.findUnique({ where: { id } });
    if (!ex) return null;
    if (ex.is_custom && ex.created_by_user_id !== userId) {
      return null;
    }
    return ex;
  }

  async createCustom(data: Prisma.ExerciseCreateInput) {
    return prisma.exercise.create({ data });
  }

  async findShuffle(muscle: string) {
    // Basic random selection for same muscle group
    const exercises = await prisma.exercise.findMany({
      where: { primary_muscle: muscle, is_custom: false },
    });
    if (!exercises.length) return null;
    return exercises[Math.floor(Math.random() * exercises.length)];
  }
}

export const exerciseRepository = new ExerciseRepository();
