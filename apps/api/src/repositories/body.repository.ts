import { prisma } from '../lib/prisma';
import { gamificationRepository } from './gamification.repository';

export class BodyRepository {
  async logWeight(userId: string, weightKg: number) {
    const log = await prisma.bodyWeightLog.create({
      data: {
        user: { connect: { id: userId } },
        weight_kg: weightKg,
        logged_at: new Date(),
      },
    });

    // Award 5 XP for consistency
    await gamificationRepository.awardXp(userId, 5, 'Logged Bodyweight');

    return log;
  }

  async getWeightHistory(userId: string) {
    const logs = await prisma.bodyWeightLog.findMany({
      where: { user_id: userId },
      orderBy: { logged_at: 'asc' },
    });

    // Compute 7-day moving averages
    const logsWithMovingAverage = logs.map((log, index, arr) => {
      const windowStart = Math.max(0, index - 6);
      const window = arr.slice(windowStart, index + 1);
      const avg = window.reduce((sum, item) => sum + item.weight_kg, 0) / window.length;
      return {
        ...log,
        moving_avg_kg: Math.round(avg * 10) / 10,
      };
    });

    const goal = await prisma.weightGoal.findUnique({
      where: { user_id: userId },
    });

    const currentWeight = logs.length > 0 ? logs[logs.length - 1].weight_kg : null;
    const startingWeight = logs.length > 0 ? logs[0].weight_kg : null;

    return {
      history: logsWithMovingAverage,
      currentWeight,
      startingWeight,
      goal,
    };
  }

  async getWeightGoal(userId: string) {
    return prisma.weightGoal.findUnique({
      where: { user_id: userId },
    });
  }

  async setWeightGoal(userId: string, goalWeightKg: number) {
    return prisma.weightGoal.upsert({
      where: { user_id: userId },
      update: { goal_weight_kg: goalWeightKg },
      create: { user_id: userId, goal_weight_kg: goalWeightKg },
    });
  }

  async logMeasurement(userId: string, data: any) {
    const payload: Record<string, number | Date | { connect: { id: string } }> = {
      user: { connect: { id: userId } },
      logged_at: data.logged_at ? new Date(data.logged_at) : new Date(),
    };

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

    const measurement = await prisma.bodyMeasurement.create({
      data: payload as any,
    });

    await gamificationRepository.awardXp(userId, 5, 'Logged Measurements');

    return measurement;
  }

  async getMeasurementHistory(userId: string) {
    return prisma.bodyMeasurement.findMany({
      where: { user_id: userId },
      orderBy: { logged_at: 'desc' },
      take: 20,
    });
  }
}

export const bodyRepository = new BodyRepository();
