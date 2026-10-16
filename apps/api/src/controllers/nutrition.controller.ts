import { Request, Response } from 'express';
import { nutritionRepository } from '../repositories/nutrition.repository';

export const searchFood = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string || '';
    const results = await nutritionRepository.searchFood(q);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDailyNutrition = async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const data = await nutritionRepository.getDailyLog(req.user!.id, date);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addNutritionLog = async (req: Request, res: Response) => {
  try {
    const log = await nutritionRepository.logFood(req.user!.id, req.body);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
