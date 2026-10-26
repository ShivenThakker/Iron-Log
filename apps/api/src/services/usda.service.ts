import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';

interface UsdaNutrient {
  nutrientId: number;
  value?: number;
}

interface UsdaFood {
  fdcId: number | string;
  description: string;
  foodNutrients?: UsdaNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

export interface ServingOption {
  name: string;
  display_name: string;
  unit: string;
  weight_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  serving_size: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  servings?: ServingOption[];
  nutrition_per_100g?: {
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g?: number;
  };
}

interface ScrapedIndianFood {
  id: string;
  name: string;
  common_name?: string;
  food_group?: string;
  cuisines?: string[];
  food_type?: string;
  unit_name?: string;
  base_unit_g?: number;
  nutrition_per_100g?: {
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
  };
  base_serving_nutrition?: {
    serving_weight_g: number;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
  };
  serving_sizes?: Array<{
    name: string;
    display_name: string;
    unit: string;
    weight_g: number;
    energy_kcal: number;
    calories_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
  }>;
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

let indianFoodsList: FoodItem[] = [];

try {
  const possiblePaths = [
    path.resolve(process.cwd(), 'apps/api/prisma/data/indian_foods.json'),
    path.resolve(process.cwd(), 'prisma/data/indian_foods.json'),
    path.resolve(__dirname, '../../prisma/data/indian_foods.json'),
    path.resolve(__dirname, '../../../prisma/data/indian_foods.json'),
  ];
  const foundPath = possiblePaths.find((p) => fs.existsSync(p));
  if (foundPath) {
    const raw = fs.readFileSync(foundPath, 'utf-8');
    const list: ScrapedIndianFood[] = JSON.parse(raw);
    indianFoodsList = list.map((f) => {
      const defaultServingName =
        f.serving_sizes?.[1]?.display_name ||
        f.serving_sizes?.[0]?.display_name ||
        f.unit_name ||
        '1 serving';
      const servingWeight =
        f.serving_sizes?.[1]?.weight_g ||
        f.serving_sizes?.[0]?.weight_g ||
        f.base_serving_nutrition?.serving_weight_g ||
        100;
      const servingLabel = `${defaultServingName} (${servingWeight}g)`;

      const cals =
        f.base_serving_nutrition?.energy_kcal ??
        f.nutrition_per_100g?.energy_kcal ??
        0;
      const protein =
        f.base_serving_nutrition?.protein_g ??
        f.nutrition_per_100g?.protein_g ??
        0;
      const carbs =
        f.base_serving_nutrition?.carbs_g ??
        f.nutrition_per_100g?.carbs_g ??
        0;
      const fat =
        f.base_serving_nutrition?.fat_g ??
        f.nutrition_per_100g?.fat_g ??
        0;
      const fiber =
        f.base_serving_nutrition?.fiber_g ??
        f.nutrition_per_100g?.fiber_g ??
        0;

      const servings: ServingOption[] = (f.serving_sizes || []).map((s) => ({
        name: s.name,
        display_name: s.display_name || s.name,
        unit: s.unit || 'gms',
        weight_g: s.weight_g || 100,
        calories_kcal: s.calories_kcal || Math.round((f.nutrition_per_100g?.energy_kcal || 0) * (s.weight_g / 100)),
        protein_g: s.protein_g ?? Math.round((f.nutrition_per_100g?.protein_g || 0) * (s.weight_g / 100) * 10) / 10,
        carbs_g: s.carbs_g ?? Math.round((f.nutrition_per_100g?.carbs_g || 0) * (s.weight_g / 100) * 10) / 10,
        fat_g: s.fat_g ?? Math.round((f.nutrition_per_100g?.fat_g || 0) * (s.weight_g / 100) * 10) / 10,
        fiber_g: s.fiber_g ?? Math.round((f.nutrition_per_100g?.fiber_g || 0) * (s.weight_g / 100) * 10) / 10,
      }));

      return {
        id: `ind_${f.id}`,
        name: f.name,
        serving_size: servingLabel,
        calories_kcal: Math.round(cals),
        protein_g: Math.round(protein * 10) / 10,
        carbs_g: Math.round(carbs * 10) / 10,
        fat_g: Math.round(fat * 10) / 10,
        fiber_g: Math.round(fiber * 10) / 10,
        servings,
        nutrition_per_100g: f.nutrition_per_100g,
      };
    });
    logger.info({ count: indianFoodsList.length }, 'Loaded local Indian food database');
  }
} catch (err) {
  logger.warn({ err }, 'Could not load local Indian food database');
}

export class UsdaService {
  private readonly apiKey = process.env.USDA_API_KEY;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  async searchFood(query: string): Promise<FoodItem[]> {
    if (!query || query.trim().length === 0) {
      return [...indianFoodsList.slice(0, 10), ...COMMON_FOODS.slice(0, 5)];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `food_search:${normalizedQuery}`;

    // Check cache
    try {
      const cached = await redis.get<FoodItem[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch {
      // Redis optional
    }

    // High-precision local matching on 5,500+ Indian foods
    const scoredIndian: { item: FoodItem; score: number; len: number }[] = [];
    for (const item of indianFoodsList) {
      const lower = item.name.toLowerCase();
      let score = 0;
      if (lower === normalizedQuery) {
        score = 100;
      } else if (lower.startsWith(normalizedQuery)) {
        score = 50;
      } else if (lower.includes(' ' + normalizedQuery)) {
        score = 30;
      } else if (lower.includes(normalizedQuery)) {
        score = 10;
      }

      if (score > 0) {
        scoredIndian.push({ item, score, len: lower.length });
      }
    }
    scoredIndian.sort((a, b) => b.score - a.score || a.len - b.len);

    // Filter fitness common foods
    const commonMatches = COMMON_FOODS.filter((f) =>
      f.name.toLowerCase().includes(normalizedQuery)
    );

    const localCombined: FoodItem[] = [
      ...commonMatches.filter((c) => c.name.toLowerCase().startsWith(normalizedQuery)),
      ...scoredIndian.slice(0, 25).map((s) => s.item),
      ...commonMatches.filter((c) => !c.name.toLowerCase().startsWith(normalizedQuery)),
    ];

    // If we have strong local results, return them immediately
    if (localCombined.length > 0) {
      const results = localCombined.slice(0, 25);
      try {
        await redis.set(cacheKey, results, { ex: 3600 * 24 });
      } catch {}
      return results;
    }

    // Fallback to USDA if key is configured and no local items matched
    if (this.apiKey) {
      try {
        const response = await axios.get<UsdaSearchResponse>(`${this.baseUrl}/foods/search`, {
          params: {
            api_key: this.apiKey,
            query: normalizedQuery,
            pageSize: 10,
            dataType: ['Foundation', 'SR Legacy'],
          },
          timeout: 4000,
        });

        const usdaFoods: FoodItem[] = (response.data?.foods || []).map((food: UsdaFood) => {
          const getNutrient = (id: number) => {
            const nutrient = food.foodNutrients?.find((n: UsdaNutrient) => n.nutrientId === id);
            return nutrient ? Number(nutrient.value) || 0 : 0;
          };

          return {
            id: `usda_${food.fdcId}`,
            name: food.description,
            serving_size: '100g',
            calories_kcal: getNutrient(1008),
            protein_g: getNutrient(1003),
            carbs_g: getNutrient(1005),
            fat_g: getNutrient(1004),
            fiber_g: getNutrient(1079),
          };
        });

        const combined = [...localCombined, ...usdaFoods].slice(0, 20);
        try {
          await redis.set(cacheKey, combined, { ex: 3600 * 24 });
        } catch {}
        return combined;
      } catch (err) {
        logger.warn({ err }, 'USDA API error, falling back to local food database');
      }
    }

    return localCombined.length > 0 ? localCombined : COMMON_FOODS.slice(0, 5);
  }
}

export const usdaService = new UsdaService();

