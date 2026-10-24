import { Request, Response, NextFunction } from 'express';
import { exerciseRepository } from '../repositories/exercise.repository';
import { NotFoundError } from '../utils/errors';

export const getAllExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const exercises = await exerciseRepository.findAll(req.user?.id, q as string);
    res.json(exercises);
  } catch (err: any) {
    next(err);
  }
};

export const getExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exerciseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ex = await exerciseRepository.findById(exerciseId, req.user?.id);
    if (!ex) {
      throw new NotFoundError('Exercise not found');
    }
    res.json(ex);
  } catch (err: any) {
    next(err);
  }
};

export const createCustomExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const userId = req.user!.id;
    const ex = await exerciseRepository.createCustom({
      ...data,
      is_custom: true,
      createdBy: { connect: { id: userId } }
    });
    res.status(201).json(ex);
  } catch (err: any) {
    next(err);
  }
};

