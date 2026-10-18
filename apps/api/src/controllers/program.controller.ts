import { Request, Response, NextFunction } from 'express';
import { programRepository } from '../repositories/program.repository';

export const getPrograms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const programs = await programRepository.findAll(req.user!.id);
    res.json(programs);
  } catch (err: any) {
    next(err);
  }
};

export const getActiveProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await programRepository.getActiveProgram(req.user!.id);
    if (!program) {
      res.status(404).json({ error: 'No active program found' });
      return;
    }
    res.json(program);
  } catch (err: any) {
    next(err);
  }
};

export const getProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const program = await programRepository.findById(id, req.user!.id);
    if (!program) {
      res.status(404).json({ error: 'Program not found' });
      return;
    }
    res.json(program);
  } catch (err: any) {
    next(err);
  }
};

export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await programRepository.create(req.user!.id, req.body);
    res.status(201).json(p);
  } catch (err: any) {
    next(err);
  }
};

export const createFullProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await programRepository.createFullProgram(req.user!.id, req.body);
    res.status(201).json(program);
  } catch (err: any) {
    next(err);
  }
};

export const saveDayPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const program = await programRepository.saveDayPlan(req.user!.id, req.body);
    res.json(program);
  } catch (err: any) {
    next(err);
  }
};

export const setActiveProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const program = await programRepository.setActiveProgram(req.user!.id, id);
    res.json(program);
  } catch (err: any) {
    next(err);
  }
};

export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const p = await programRepository.update(id, req.user!.id, req.body);
    res.json(p);
  } catch (err: any) {
    next(err);
  }
};

export const deleteProgram = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await programRepository.delete(id, req.user!.id);
    res.status(204).send();
  } catch (err: any) {
    next(err);
  }
};
