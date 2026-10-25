import { usdaService, FoodItem } from './usda.service';

export class FoodSearchService {
  async search(query: string): Promise<FoodItem[]> {
    return usdaService.searchFood(query);
  }
}

export const foodSearchService = new FoodSearchService();
