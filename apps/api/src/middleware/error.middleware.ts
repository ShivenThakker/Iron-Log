import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errorObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : {};
  const message = typeof errorObj.message === 'string' ? errorObj.message : 'Unknown error';
  const stack = typeof errorObj.stack === 'string' ? errorObj.stack : undefined;
  const code = typeof errorObj.code === 'string' ? errorObj.code : undefined;
  const status = typeof errorObj.status === 'number' ? errorObj.status : undefined;
  const statusCode = typeof errorObj.statusCode === 'number' ? errorObj.statusCode : undefined;

  logger.error({
    message,
    stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  if (code === 'P2002') {
    res.status(409).json({
      error: 'A resource with this identifier already exists',
    });
    return;
  }

  if (code === 'P2025') {
    res.status(404).json({
      error: 'Resource not found',
    });
    return;
  }

  const resolvedStatus = status || statusCode || 500;
  res.status(resolvedStatus).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
  });
};
