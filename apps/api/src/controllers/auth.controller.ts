import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data.email, data.password, data.fullName);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data.email, data.password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Login failed' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'No refresh token provided' });
    const result = await AuthService.refresh(refreshToken);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Refresh failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Clear refresh tokens if we stored them in DB
  res.json({ success: true });
};
