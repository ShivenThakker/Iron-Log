import axios from 'axios';
import { redis } from '../lib/redis';

export interface FoodItem {
  id: string;
  name: string;
  serving_size: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}

const COMMON_FOODS: FoodItem[] = [
  { id: 'f_chicken_breast', name: 'Chicken Breast (Cooked)', serving_size: '100g', calories_kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 'f_eggs', name: 'Whole Egg (Large)', serving_size: '1 egg (50g)', calories_kcal: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8 },
  { id: 'f_egg_whites', name: 'Egg Whites', serving_size: '100g', calories_kcal: 52, protein_g: 11, carbs_g: 0.7, fat_g: 0.2 },
  { id: 'f_whey_protein', name: 'Whey Protein Isolate', serving_size: '1 scoop (30g)', calories_kcal: 120, protein_g: 25, carbs_g: 2, fat_g: 1 },
  { id: 'f_greek_yogurt', name: 'Greek Yogurt (0% Fat)', serving_size: '150g', calories_kcal: 90, protein_g: 15, carbs_g: 6, fat_g: 0 },
  { id: 'f_salmon', name: 'Atlantic Salmon (Cooked)', serving_size: '100g', calories_kcal: 206, protein_g: 22, carbs_g: 0, fat_g: 12 },
  { id: 'f_tuna', name: 'Canned Tuna in Water', serving_size: '1 can drained (120g)', calories_kcal: 130, protein_g: 28, carbs_g: 0, fat_g: 1 },
  { id: 'f_ground_beef_90_10', name: 'Lean Ground Beef (90/10)', serving_size: '100g', calories_kcal: 176, protein_g: 20, carbs_g: 0, fat_g: 10 },
  { id: 'f_white_rice', name: 'White Rice (Cooked)', serving_size: '1 cup (158g)', calories_kcal: 205, protein_g: 4.2, carbs_g: 45, fat_g: 0.4 },
  { id: 'f_brown_rice', name: 'Brown Rice (Cooked)', serving_size: '1 cup (195g)', calories_kcal: 218, protein_g: 4.5, carbs_g: 46, fat_g: 1.6 },
  { id: 'f_oatmeal', name: 'Rolled Oats (Dry)', serving_size: '1/2 cup (40g)', calories_kcal: 150, protein_g: 5, carbs_g: 27, fat_g: 2.5, fiber_g: 4 },
  { id: 'f_sweet_potato', name: 'Sweet Potato (Baked)', serving_size: '1 medium (114g)', calories_kcal: 103, protein_g: 2.3, carbs_g: 24, fat_g: 0.2 },
  { id: 'f_banana', name: 'Banana', serving_size: '1 medium (118g)', calories_kcal: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.3 },
  { id: 'f_apple', name: 'Apple', serving_size: '1 medium (182g)', calories_kcal: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3 },
  { id: 'f_peanut_butter', name: 'Peanut Butter', serving_size: '2 tbsp (32g)', calories_kcal: 188, protein_g: 8, carbs_g: 7, fat_g: 16 },
  { id: 'f_almonds', name: 'Raw Almonds', serving_size: '1 oz (28g)', calories_kcal: 164, protein_g: 6, carbs_g: 6, fat_g: 14 },
  { id: 'f_olive_oil', name: 'Extra Virgin Olive Oil', serving_size: '1 tbsp (14g)', calories_kcal: 119, protein_g: 0, carbs_g: 0, fat_g: 14 },
  { id: 'f_avocado', name: 'Avocado', serving_size: '1/2 medium (100g)', calories_kcal: 160, protein_g: 2, carbs_g: 9, fat_g: 15 },
  { id: 'f_broccoli', name: 'Broccoli (Steamed)', serving_size: '1 cup (156g)', calories_kcal: 55, protein_g: 3.7, carbs_g: 11, fat_g: 0.6 },
  { id: 'f_spinach', name: 'Baby Spinach (Raw)', serving_size: '2 cups (60g)', calories_kcal: 14, protein_g: 1.7, carbs_g: 2.2, fat_g: 0.2 },
  { id: 'f_milk_whole', name: 'Whole Milk', serving_size: '1 cup (244g)', calories_kcal: 149, protein_g: 7.7, carbs_g: 12, fat_g: 8 },
  { id: 'f_almond_milk', name: 'Unsweetened Almond Milk', serving_size: '1 cup (240ml)', calories_kcal: 30, protein_g: 1, carbs_g: 1, fat_g: 2.5 },
];

export class UsdaService {
  private readonly apiKey = process.env.USDA_API_KEY;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  async searchFood(query: string): Promise<FoodItem[]> {
    if (!query || query.trim().length === 0) {
      return COMMON_FOODS.slice(0, 10);
    }

    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `food_search:${normalizedQuery}`;

    // Check cache
    const cached = await redis.get<FoodItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Filter local common foods first
    const localMatches = COMMON_FOODS.filter((f) =>
      f.name.toLowerCase().includes(normalizedQuery)
    );

    if (this.apiKey) {
      try {
        const response = await axios.get(`${this.baseUrl}/foods/search`, {
          params: {
            api_key: this.apiKey,
            query: normalizedQuery,
            pageSize: 10,
            dataType: ['Foundation', 'SR Legacy'],
          },
          timeout: 4000,
        });

        const usdaFoods: FoodItem[] = (response.data?.foods || []).map((food: any) => {
          const getNutrient = (id: number) => {
            const nutrient = food.foodNutrients?.find((n: any) => n.nutrientId === id);
            return nutrient ? Number(nutrient.value) || 0 : 0;
          };

          return {
            id: `usda_${food.fdcId}`,
            name: food.description,
            serving_size: '100g',
            calories_kcal: getNutrient(1008), // Energy
            protein_g: getNutrient(1003),     // Protein
            carbs_g: getNutrient(1005),       // Carbohydrates
            fat_g: getNutrient(1004),         // Total lipid
            fiber_g: getNutrient(1079),       // Fiber
          };
        });

        const combined = [...localMatches, ...usdaFoods].slice(0, 15);
        await redis.set(cacheKey, combined, { ex: 3600 * 24 });
        return combined;
      } catch (err: any) {
        console.warn('USDA API error, falling back to local food database:', err?.message || err);
      }
    }

    return localMatches.length > 0 ? localMatches : COMMON_FOODS.slice(0, 5);
  }
}

export const usdaService = new UsdaService();
