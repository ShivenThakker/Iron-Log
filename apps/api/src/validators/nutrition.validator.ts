import { z } from 'zod';

export const logNutritionSchema = z.object({
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').default(() => new Date().toISOString().split('T')[0]),
  meal_slot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food_name: z.string().min(1, 'Food name is required'),
  serving_size: z.string().optional(),
  calories_kcal: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  fiber_g: z.number().nonnegative().optional(),
});
