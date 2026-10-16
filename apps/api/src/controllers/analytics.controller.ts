import { Request, Response } from 'express';
import { analyticsRepository } from '../repositories/analytics.repository';

export const getWorkoutStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await analyticsRepository.getWorkoutStats(userId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getHeatmap = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const days = req.query.period === 'week' ? 7 : req.query.period === 'all' ? 365 : 30;
    const heatmap = await analyticsRepository.getMuscleHeatmap(userId, days);
    res.json(heatmap);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRadar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const radar = await analyticsRepository.getMuscleRadar(userId);
    res.json(radar);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const equipment = await analyticsRepository.getEquipmentDistribution(userId);
    res.json(equipment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
