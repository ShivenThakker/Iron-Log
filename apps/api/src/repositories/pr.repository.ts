import { prisma } from '../lib/prisma';

export class PRRepository {
  async findCurrentPR(userId: string, exerciseId: string) {
    return prisma.personalRecord.findFirst({
      where: { user_id: userId, exercise_id: exerciseId },
      orderBy: { estimated_1rm_kg: 'desc' },
    });
  }

  async createPR(data: {
    userId: string;
    exerciseId: string;
    weightKg: number;
    reps: number;
    estimated1RM: number;
    sessionId: string;
  }) {
    return prisma.personalRecord.create({
      data: {
        user_id: data.userId,
        exercise_id: data.exerciseId,
        weight_kg: data.weightKg,
        reps: data.reps,
        estimated_1rm_kg: data.estimated1RM,
        session_id: data.sessionId,
        achieved_at: new Date(),
      },
    });
  }

  async getRecentPRs(userId: string, limit = 5) {
    return prisma.personalRecord.findMany({
      where: { user_id: userId },
      orderBy: { achieved_at: 'desc' },
      take: limit,
    });
  }
}

export const prRepository = new PRRepository();
