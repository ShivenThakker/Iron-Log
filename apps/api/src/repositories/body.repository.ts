import { prisma } from '../lib/prisma';
import { gamificationRepository } from './gamification.repository';

export interface BodyMeasurementInput {
  logged_at?: string | Date;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  left_arm_cm?: number;
  right_arm_cm?: number;
  left_thigh_cm?: number;
  right_thigh_cm?: number;
  neck_cm?: number;
  body_fat_pct?: number;
}

export class BodyRepository {
  async logWeight(userId: string, weightKg: number) {
    const log = await prisma.bodyWeightLog.create({
      data: {
        user: { connect: { id: userId } },
        weight_kg: weightKg,
        logged_at: new Date(),
      },
    });

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

  async logMeasurement(userId: string, data: BodyMeasurementInput) {
    const measurement = await prisma.bodyMeasurement.create({
      data: {
        user: { connect: { id: userId } },
        logged_at: data.logged_at ? new Date(data.logged_at) : new Date(),
        chest_cm: data.chest_cm,
        waist_cm: data.waist_cm,
        hips_cm: data.hips_cm,
        left_arm_cm: data.left_arm_cm,
        right_arm_cm: data.right_arm_cm,
        left_thigh_cm: data.left_thigh_cm,
        right_thigh_cm: data.right_thigh_cm,
        neck_cm: data.neck_cm,
        body_fat_pct: data.body_fat_pct,
      },
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
