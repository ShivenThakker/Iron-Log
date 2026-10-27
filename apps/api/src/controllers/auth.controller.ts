import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/errors';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const tokens = await authService.register(email, password, name);
    res.status(201).json(tokens);
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 400;
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(status).json({ error: message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.login(email, password);
    res.status(200).json(tokens);
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Invalid credentials';
    res.status(status).json({ error: message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.status(200).json(tokens);
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Invalid refresh token';
    res.status(status).json({ error: message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    const tokens = await authService.googleAuth(idToken);
    res.status(200).json(tokens);
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Google authentication failed';
    res.status(status).json({ error: message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await authService.changePassword(req.user!.id, current_password, new_password);
    res.status(200).json(result);
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 400;
    const message = err instanceof Error ? err.message : 'Failed to change password';
    res.status(status).json({ error: message });
  }
};
