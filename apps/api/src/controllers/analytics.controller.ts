import { Request, Response } from 'express';
import { analyticsRepository } from '../repositories/analytics.repository';

export const getWorkoutStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await analyticsRepository.getWorkoutStats(userId);
    res.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getHeatmap = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawPeriod = req.query.period;
    const parsedDays = Number(rawPeriod);
    const days =
      Number.isFinite(parsedDays) && parsedDays > 0
        ? parsedDays
        : rawPeriod === 'week'
          ? 7
          : rawPeriod === 'all'
            ? 365
            : 30;
    const heatmap = await analyticsRepository.getMuscleHeatmap(userId, days);
    res.json(heatmap);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getRadar = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const radar = await analyticsRepository.getMuscleRadar(userId);
    res.json(radar);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const equipment = await analyticsRepository.getEquipmentDistribution(userId);
    res.json(equipment);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
