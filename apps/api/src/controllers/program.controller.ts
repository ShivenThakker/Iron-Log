import { Request, Response } from 'express';
import { programRepository } from '../repositories/program.repository';

export const getPrograms = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const programs = await programRepository.findAll(req.user.id);
    res.json(programs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getProgram = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const program = await programRepository.findById(req.params.id, req.user.id);
    if (!program) {
       res.status(404).json({ error: 'Program not found' });
       return;
    }
    res.json(program);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createProgram = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const p = await programRepository.create(req.user.id, req.body);
    res.status(201).json(p);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const p = await programRepository.update(req.params.id, req.user.id, req.body);
    res.json(p);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    await programRepository.delete(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
