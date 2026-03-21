import { PrismaClient, Prisma } from '@prisma/client';
import { sqliteAdapter } from '../lib/prisma-adapter';

const prisma = new PrismaClient({ adapter: sqliteAdapter });

export class ExerciseRepository {
  async findAll(query?: string) {
    if (query) {
      return prisma.exercise.findMany({
        where: { name: { contains: query } }
      });
    }
    return prisma.exercise.findMany();
  }

  async findById(id: string) {
    return prisma.exercise.findUnique({ where: { id } });
  }

  async createCustom(data: Prisma.ExerciseCreateInput) {
    return prisma.exercise.create({ data });
  }

  async findShuffle(muscle: string) {
    // Basic random selection for same muscle group
    const exercises = await prisma.exercise.findMany({
      where: { primary_muscle: muscle }
    });
    if (!exercises.length) return null;
    return exercises[Math.floor(Math.random() * exercises.length)];
  }
}

export const exerciseRepository = new ExerciseRepository();
