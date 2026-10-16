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
