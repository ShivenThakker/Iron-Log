import { Request, Response } from 'express';
import { bodyRepository } from '../repositories/body.repository';

export const addWeightLog = async (req: Request, res: Response) => {
  try {
    const { weight_kg } = req.body;
    // @ts-ignore
    const log = await bodyRepository.logWeight(req.user.id, weight_kg);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getWeightHistory = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const history = await bodyRepository.getWeightHistory(userId);
    const goal = await bodyRepository.getWeightGoal(userId);
    res.json({ history, goal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addMeasurement = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const msmt = await bodyRepository.logMeasurement(req.user.id, req.body);
    res.status(201).json(msmt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
