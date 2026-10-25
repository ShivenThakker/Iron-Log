import { prisma } from '../lib/prisma';
import { gamificationRepository } from './gamification.repository';

export interface LogFoodInput {
  food_name: string;
  meal_slot?: string;
  calories_kcal?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  fat_g?: number;
  quantity_g?: number;
  serving_amount?: number;
  logged_date?: string | Date;
}

export interface SetNutritionGoalInput {
  daily_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  water_ml?: number;
}

export class NutritionRepository {
  async getDailyLog(userId: string, dateStr: string, timezoneOffsetMinutes?: number) {
    let startOfDay: Date;
    let endOfDay: Date;

    if (typeof timezoneOffsetMinutes === 'number' && Number.isFinite(timezoneOffsetMinutes)) {
      const utcMs = Date.parse(`${dateStr}T00:00:00.000Z`);
      startOfDay = new Date(utcMs + timezoneOffsetMinutes * 60 * 1000);
      endOfDay = new Date(utcMs + (timezoneOffsetMinutes + 24 * 60) * 60 * 1000 - 1);
    } else {
      startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    }

    const [logs, goal] = await Promise.all([
      prisma.foodLogEntry.findMany({
        where: {
          user_id: userId,
          logged_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { logged_at: 'asc' },
      }),
      prisma.nutritionGoal.findUnique({
        where: { user_id: userId },
      }),
    ]);

    const defaultGoal = {
      daily_calories: 2200,
      protein_g: 160,
      carbs_g: 220,
      fats_g: 65,
      water_ml: 2500,
    };

    const activeGoal = goal || defaultGoal;

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories_kcal ?? 0),
        protein: acc.protein + (log.protein_g ?? 0),
        carbs: acc.carbs + (log.carbs_g ?? 0),
        fat: acc.fat + (log.fats_g ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const remaining = {
      calories: Math.max((activeGoal.daily_calories ?? 2200) - totals.calories, 0),
      protein: Math.max((activeGoal.protein_g ?? 160) - totals.protein, 0),
      carbs: Math.max((activeGoal.carbs_g ?? 220) - totals.carbs, 0),
      fat: Math.max((activeGoal.fats_g ?? 65) - totals.fat, 0),
    };

    // Group logs by meal slot
    const meals = {
      breakfast: logs.filter((l) => l.meal_slot === 'breakfast'),
      lunch: logs.filter((l) => l.meal_slot === 'lunch'),
      dinner: logs.filter((l) => l.meal_slot === 'dinner'),
      snack: logs.filter((l) => l.meal_slot === 'snack'),
    };

    return {
      date: dateStr,
      logs,
      meals,
      totals,
      goal: activeGoal,
      remaining,
    };
  }

  async logFood(userId: string, data: LogFoodInput) {
    let logDate: Date;
    if (typeof data.logged_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.logged_date)) {
      logDate = new Date(`${data.logged_date}T12:00:00.000Z`);
    } else if (data.logged_date) {
      logDate = new Date(data.logged_date);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      logDate = new Date(`${todayStr}T12:00:00.000Z`);
    }

    const log = await prisma.foodLogEntry.create({
      data: {
        user: { connect: { id: userId } },
        meal_slot: data.meal_slot || 'snack',
        food_name: data.food_name,
        calories_kcal: data.calories_kcal ?? data.calories ?? 0,
        protein_g: data.protein_g ?? 0,
        carbs_g: data.carbs_g ?? 0,
        fats_g: data.fats_g ?? data.fat_g ?? 0,
        quantity_g: data.quantity_g ?? data.serving_amount ?? 100,
        logged_date: logDate,
        logged_at: new Date(),
      },
    });

    await gamificationRepository.awardXp(userId, 5, 'Logged Nutrition');

    return log;
  }

  async setNutritionGoal(userId: string, goalData: SetNutritionGoalInput) {
    return prisma.nutritionGoal.upsert({
      where: { user_id: userId },
      update: {
        daily_calories: goalData.daily_calories,
        protein_g: goalData.protein_g,
        carbs_g: goalData.carbs_g,
        fats_g: goalData.fats_g,
        water_ml: goalData.water_ml ?? 2500,
      },
      create: {
        user_id: userId,
        daily_calories: goalData.daily_calories ?? 2200,
        protein_g: goalData.protein_g ?? 160,
        carbs_g: goalData.carbs_g ?? 220,
        fats_g: goalData.fats_g ?? 65,
        water_ml: goalData.water_ml ?? 2500,
      },
    });
  }
}

export const nutritionRepository = new NutritionRepository();
