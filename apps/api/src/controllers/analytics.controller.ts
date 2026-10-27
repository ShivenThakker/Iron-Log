import { Request, Response } from 'express';
import { analyticsRepository } from '../repositories/analytics.repository';

export const getWorkoutStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawPeriod = req.query.period;
    const parsedDays = Number(rawPeriod);
    const days =
      Number.isFinite(parsedDays) && parsedDays > 0
        ? parsedDays
        : rawPeriod === 'all'
          ? undefined
          : undefined;
    const stats = await analyticsRepository.getWorkoutStats(userId, days);
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
    const radar = await analyticsRepository.getMuscleRadar(userId, days);
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

export const getActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawYear = req.query.year;
    const year = rawYear ? parseInt(rawYear as string, 10) : undefined;
    const activity = await analyticsRepository.getWorkoutActivity(userId, year);
    res.json(activity);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};
