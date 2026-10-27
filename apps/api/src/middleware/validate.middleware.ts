import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue?.path?.join('.') || '';
      const rawMsg = issue?.message || 'Validation failed';
      const userFriendlyMessage = path && !rawMsg.startsWith(path) ? `${path}: ${rawMsg}` : rawMsg;
      res.status(400).json({
        error: userFriendlyMessage,
        details: result.error.flatten(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
};
