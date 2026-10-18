import { Request, Response, NextFunction } from 'express';
import { sessionRepository } from '../repositories/session.repository';
import { checkAndCreatePR } from '../services/prDetection';
import { NotFoundError } from '../utils/errors';

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionRepository.createSession(req.user!.id, req.body);
    res.status(201).json(session);
  } catch (err: any) {
    next(err);
  }
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const s = await sessionRepository.getSession(sessionId, req.user!.id);
    if (!s) {
      throw new NotFoundError('Workout session not found');
    }
    res.json(s);
  } catch (err: any) {
    next(err);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await sessionRepository.getSessions(req.user!.id));
  } catch (err: any) {
    next(err);
  }
};

export const addSet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    const sset = await sessionRepository.addSet(id, userId, req.body);

    let prResult = { isNewPR: false };
    if (req.body.set_type !== 'warmup' && req.body.weight_kg && req.body.reps) {
      prResult = await checkAndCreatePR(userId, req.body.exercise_id, req.body.weight_kg, req.body.reps, id);
    }

    res.status(201).json({ set: sset, pr: prResult });
  } catch (err: any) {
    next(err);
  }
};

export const finishSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await sessionRepository.finishSession(sessionId, req.user!.id, req.body);
    res.json(result);
  } catch (err: any) {
    next(err);
  }
};
