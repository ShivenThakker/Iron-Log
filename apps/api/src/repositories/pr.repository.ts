import { prisma } from '../lib/prisma';
import { gamificationRepository } from './gamification.repository';

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message || '';
  return code === 'P2002' || message.includes('UNIQUE constraint failed');
}

export class PRRepository {
  async findCurrentPR(userId: string, exerciseId: string) {
    return prisma.personalRecord.findFirst({
      where: { user_id: userId, exercise_id: exerciseId },
      orderBy: { estimated_1rm_kg: 'desc' },
    });
  }

  async recordPersonalRecordOnce(input: {
    userId: string;
    exerciseId: string;
    weightKg: number;
    reps: number;
    estimated1rmKg: number;
    sessionId: string;
    xpAmount?: number;
    achievedAt?: Date;
  }): Promise<{ isNewPR: boolean; record?: any }> {
    try {
      const record = await prisma.$transaction(async (tx) => {
        // 1) Insert FIRST. If duplicate exists, throws unique violation and transaction rolls back
        const pr = await tx.personalRecord.create({
          data: {
            user_id: input.userId,
            exercise_id: input.exerciseId,
            weight_kg: input.weightKg,
            reps: input.reps,
            estimated_1rm_kg: input.estimated1rmKg,
            session_id: input.sessionId,
            achieved_at: input.achievedAt || new Date(),
          },
        });

        // 2) Award XP only after successful insert within the same transaction
        await gamificationRepository.awardXp(
          input.userId,
          input.xpAmount ?? 25,
          'New Personal Record',
          tx
        );

        return pr;
      });

      return { isNewPR: true, record };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { isNewPR: false };
      }
      throw error;
    }
  }

  async createPR(data: {
    userId: string;
    exerciseId: string;
    weightKg: number;
    reps: number;
    estimated1RM: number;
    sessionId: string;
  }) {
    const res = await this.recordPersonalRecordOnce({
      userId: data.userId,
      exerciseId: data.exerciseId,
      weightKg: data.weightKg,
      reps: data.reps,
      estimated1rmKg: data.estimated1RM,
      sessionId: data.sessionId,
    });
    return res.record;
  }

  async getAllPRs(userId: string) {
    return prisma.personalRecord.findMany({
      where: { user_id: userId },
      include: { exercise: true },
      orderBy: { achieved_at: 'desc' },
    });
  }

  async getRecentPRs(userId: string, limit = 5) {
    return prisma.personalRecord.findMany({
      where: { user_id: userId },
      include: { exercise: true },
      orderBy: { achieved_at: 'desc' },
      take: limit,
    });
  }
}

export const prRepository = new PRRepository();
