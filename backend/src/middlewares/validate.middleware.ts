import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { sendError } from '../utils/response.utils';

export function validate(schema: ZodType<any, any, any>, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || (error as any).errors || [];
        const formattedErrors = issues.map((err: any) => ({
          field: err.path && err.path.length > 0 ? err.path.join('.') : source,
          message: err.message,
        }));
        return sendError(res, 'Validation failed', 400, formattedErrors, 'VALIDATION_ERROR');
      }
      return sendError(res, 'Invalid request data', 400, error);
    }
  };
}
