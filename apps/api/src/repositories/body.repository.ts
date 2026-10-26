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

  async getWeightHistory(userId: string, period?: string | number) {
    const allLogs = await prisma.bodyWeightLog.findMany({
      where: { user_id: userId },
      orderBy: { logged_at: 'asc' },
    });

    // Compute 7-day moving averages across full timeline
    const logsWithMovingAverage = allLogs.map((log, index, arr) => {
      const windowStart = Math.max(0, index - 6);
      const window = arr.slice(windowStart, index + 1);
      const avg = window.reduce((sum, item) => sum + item.weight_kg, 0) / window.length;
      return {
        ...log,
        moving_avg_kg: Math.round(avg * 10) / 10,
      };
    });

    const parsedDays = Number(period);
    const filterDays =
      Number.isFinite(parsedDays) && parsedDays > 0
        ? parsedDays
        : period === '30'
          ? 30
          : period === '90'
            ? 90
            : null;

    let filteredHistory = logsWithMovingAverage;
    if (filterDays !== null && filterDays > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filterDays);
      filteredHistory = logsWithMovingAverage.filter((item) => new Date(item.logged_at) >= cutoff);
    }

    const goal = await prisma.weightGoal.findUnique({
      where: { user_id: userId },
    });

    const currentWeight = allLogs.length > 0 ? allLogs[allLogs.length - 1].weight_kg : null;
    const startingWeight = filteredHistory.length > 0
      ? filteredHistory[0].weight_kg
      : allLogs.length > 0
        ? allLogs[0].weight_kg
        : null;

    return {
      history: filteredHistory,
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
