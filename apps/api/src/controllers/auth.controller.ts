import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const tokens = await authService.register(email, password, name);
    res.status(201).json(tokens);
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ error: err.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.login(email, password);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    const tokens = await authService.googleAuth(idToken);
    res.status(200).json(tokens);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({ error: err.message });
  }
};
