import { Request, Response } from 'express';
import { bodyRepository } from '../repositories/body.repository';

export const addWeightLog = async (req: Request, res: Response) => {
  try {
    const { weight_kg } = req.body;
    const log = await bodyRepository.logWeight(req.user!.id, weight_kg);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getWeightHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const weightData = await bodyRepository.getWeightHistory(userId);
    res.json(weightData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addMeasurement = async (req: Request, res: Response) => {
  try {
    const msmt = await bodyRepository.logMeasurement(req.user!.id, req.body);
    res.status(201).json(msmt);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getMeasurements = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const history = await bodyRepository.getMeasurementHistory(userId);
    const latest = history[0] || null;
    res.json({ history, latest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
