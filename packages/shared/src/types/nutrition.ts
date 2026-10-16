export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionLogData {
  id?: string;
  user_id: string;
  logged_date: string;
  meal_slot: MealSlot;
  food_name: string;
  serving_size?: string | null;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number | null;
}

export interface DailyNutritionSummary {
  date: string;
  calories: { consumed: number; target: number };
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };
  meals: Record<MealSlot, NutritionLogData[]>;
}
