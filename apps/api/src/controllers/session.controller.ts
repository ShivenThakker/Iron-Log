import { Request, Response } from 'express';
import { sessionRepository } from '../repositories/session.repository';
import { checkAndCreatePR } from '../services/prDetection';

export const startSession = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const session = await sessionRepository.createSession(req.user.id, req.body);
    res.status(201).json(session);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const s = await sessionRepository.getSession(req.params.id, req.user.id);
    res.json(s);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    res.json(await sessionRepository.getSessions(req.user.id));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const addSet = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    
    const sset = await sessionRepository.addSet(id, req.body);

    let prResult = { isNewPR: false };
    if (req.body.set_type !== 'warmup' && req.body.weight_kg && req.body.reps) {
      prResult = await checkAndCreatePR(userId, req.body.exercise_id, req.body.weight_kg, req.body.reps, id);
    }

    res.status(201).json({ set: sset, pr: prResult });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const finishSession = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const s = await sessionRepository.finishSession(req.params.id, req.user.id);
    res.json(s);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
