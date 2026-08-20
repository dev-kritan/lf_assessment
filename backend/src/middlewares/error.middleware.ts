import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response.utils';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`${req.method} ${req.originalUrl} - Error:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  const code = err.code || 'SERVER_ERROR';

  sendError(res, message, statusCode, details, code);
}
