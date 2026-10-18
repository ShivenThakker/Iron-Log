import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstMessage = result.error.issues[0]?.message || 'Validation failed';
      res.status(400).json({
        error: firstMessage,
        details: result.error.flatten(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
};
