import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';

interface JwtAuthPayload {
  id: string;
}

function isJwtAuthPayload(payload: unknown): payload is JwtAuthPayload {
  return typeof payload === 'object' && payload !== null && 'id' in payload && typeof (payload as { id: unknown }).id === 'string';
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!isJwtAuthPayload(decoded)) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};
