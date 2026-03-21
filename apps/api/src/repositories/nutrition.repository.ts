import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class NutritionRepository {
  async searchFood(query: string) {
    const mockFoods = [
      { id: 'f1', name: 'Chicken Breast (raw)', calories: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6, serving_size_g: 100 },
      { id: 'f2', name: 'White Rice (cooked)', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, serving_size_g: 100 },
      { id: 'f3', name: 'Broccoli', calories: 34, protein_g: 2.8, carbs_g: 6.6, fat_g: 0.4, serving_size_g: 100 },
      { id: 'f4', name: 'Whole Egg', calories: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5, serving_size_g: 100 },
      { id: 'f5', name: 'Oats', calories: 389, protein_g: 16.9, carbs_g: 66.3, fat_g: 6.9, serving_size_g: 100 },
    ];
    return mockFoods.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  }

  async getDailyLog(userId: string, dateStr: string) {
    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(dateStr);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const logs = await prisma.nutritionLog.findMany({
      where: {
        user_id: userId,
        logged_at: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    const totals = logs.reduce((acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein_g,
      carbs: acc.carbs + log.carbs_g,
      fat: acc.fat + log.fat_g
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return { logs, totals };
  }

  async logFood(userId: string, data: any) {
    const log = await prisma.nutritionLog.create({
      data: {
        user: { connect: { id: userId } },
        meal_type: data.meal_type || 'snack',
        food_name: data.food_name,
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        serving_amount: data.serving_amount,
        serving_unit: data.serving_unit,
        logged_at: data.logged_at ? new Date(data.logged_at) : new Date()
      }
    });

    // Provide 10XP for logging food efficiently! Gamification touch point.
    await prisma.xpTransaction.create({
       data: { user_id: userId, amount: 10, reason: 'Logged Nutrition' }
    });
    
    return log;
  }
}
export const nutritionRepository = new NutritionRepository();
