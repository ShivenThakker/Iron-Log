import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

export const register = async (req: Request, res: Response) => {
  try {
    const validated = authSchema.parse(req.body);
    const tokens = await authService.register(validated.email, validated.password, validated.name);
    res.status(201).json(tokens);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Validation failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validated = authSchema.parse(req.body);
    const tokens = await authService.login(validated.email, validated.password);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};
