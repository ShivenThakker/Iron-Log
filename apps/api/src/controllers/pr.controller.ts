import { Request, Response } from 'express';
import { prRepository } from '../repositories/pr.repository';

export const getPersonalRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const records = await prRepository.getAllPRs(userId);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecentPersonalRecords = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;
    const records = await prRepository.getRecentPRs(userId, limit);
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
