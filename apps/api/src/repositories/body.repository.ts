import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

// singleton imported

export class BodyRepository {
  async logWeight(userId: string, weightKg: number) {
    const log = await prisma.bodyWeightLog.create({
      data: {
        user: { connect: { id: userId } },
        weight_kg: weightKg,
        logged_at: new Date()
      }
    });

    // Gamification XP for consistency
    await prisma.xpTransaction.create({
       data: { user_id: userId, amount: 10, reason: 'Logged Bodyweight' }
    });

    return log;
  }

  async getWeightHistory(userId: string) {
    return prisma.bodyWeightLog.findMany({
      where: { user_id: userId },
      orderBy: { logged_at: 'asc' }
    });
  }

  async getWeightGoal(userId: string) {
    return prisma.weightGoal.findUnique({
      where: { user_id: userId }
    });
  }

  async logMeasurement(userId: string, data: any) {
    const payload: Record<string, number | Date | { connect: { id: string } }> = {
      user: { connect: { id: userId } },
      logged_at: data.logged_at ? new Date(data.logged_at) : new Date(),
    };

    const measurementKeyMap: Record<string, string> = {
      chest: 'chest_cm',
      waist: 'waist_cm',
      hips: 'hips_cm',
      left_arm: 'left_arm_cm',
      right_arm: 'right_arm_cm',
      left_thigh: 'left_thigh_cm',
      right_thigh: 'right_thigh_cm',
      neck: 'neck_cm',
      body_fat: 'body_fat_pct',
    };

    if (data.measurement_type && typeof data.value_cm === 'number') {
      const mappedKey = measurementKeyMap[data.measurement_type];
      if (mappedKey) {
        payload[mappedKey] = data.value_cm;
      }
    }

    const directFields = [
      'chest_cm',
      'waist_cm',
      'hips_cm',
      'left_arm_cm',
      'right_arm_cm',
      'left_thigh_cm',
      'right_thigh_cm',
      'neck_cm',
      'body_fat_pct',
    ] as const;

    for (const field of directFields) {
      if (typeof data[field] === 'number') {
        payload[field] = data[field];
      }
    }

    return prisma.bodyMeasurement.create({
      data: payload as any
    });
  }
}
export const bodyRepository = new BodyRepository();
