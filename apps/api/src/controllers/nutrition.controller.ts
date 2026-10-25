import { Request, Response } from 'express';
import { nutritionRepository } from '../repositories/nutrition.repository';
import { usdaService } from '../services/usda.service';

export const searchFood = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const results = await usdaService.searchFood(q);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getDailyNutrition = async (req: Request, res: Response) => {
  try {
    const date = (req.params.date as string) || (req.query.date as string) || new Date().toISOString().split('T')[0];
    const tzOffset = req.query.tzOffset !== undefined ? Number(req.query.tzOffset) : undefined;
    const data = await nutritionRepository.getDailyLog(req.user!.id, date, tzOffset);
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const addNutritionLog = async (req: Request, res: Response) => {
  try {
    const log = await nutritionRepository.logFood(req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: message });
  }
};
