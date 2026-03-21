import { Request, Response } from 'express';
import { exerciseRepository } from '../repositories/exercise.repository';

export const getAllExercises = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const exercises = await exerciseRepository.findAll(q as string);
    res.json(exercises);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getExercise = async (req: Request, res: Response) => {
  try {
    const ex = await exerciseRepository.findById(req.params.id);
    if (!ex) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(ex);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createCustomExercise = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // @ts-ignore
    const userId = req.user.id;
    const ex = await exerciseRepository.createCustom({
      ...data,
      is_custom: true,
      createdBy: { connect: { id: userId } }
    });
    res.status(201).json(ex);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const shuffleExercise = async (req: Request, res: Response) => {
  try {
    const { muscle } = req.query;
    if (!muscle) {
      res.status(400).json({ error: 'Muscle group required' });
      return;
    }
    const ex = await exerciseRepository.findShuffle(muscle as string);
    if (!ex) {
      res.status(404).json({ error: 'No exercises found for this muscle' });
      return;
    }
    res.json(ex);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
