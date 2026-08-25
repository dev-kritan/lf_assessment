import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response.utils';
import { AppError } from '../utils/errors';
import { ERROR_CODES } from '../constants';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Always log the full error with request context
  logger.error(`${req.method} ${req.originalUrl} - Error:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    errno: err.errno,
  });

  // 1. Handled Operational AppError instances
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details, err.code);
  }

  // 2. Express Body-Parser Malformed JSON SyntaxError
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return sendError(
      res,
      'Malformed JSON body: Please verify your JSON payload syntax.',
      400,
      undefined,
      ERROR_CODES.INVALID_JSON || 'INVALID_JSON'
    );
  }

  // 3. Database Unique Constraint Violations (MySQL & SQLite)
  const isDuplicateKey =
    err.code === 'ER_DUP_ENTRY' ||
    err.errno === 1062 ||
    (typeof err.message === 'string' &&
      (err.message.includes('UNIQUE constraint failed') ||
        err.message.includes('Duplicate entry')));

  if (isDuplicateKey) {
    let duplicateField = 'record';
    if (err.message.includes('users.email') || err.message.includes('email')) {
      duplicateField = 'Email address';
    } else if (err.message.includes('tags.name') || err.message.includes('name')) {
      duplicateField = 'Tag name';
    }

    return sendError(
      res,
      `A ${duplicateField.toLowerCase()} with this value already exists.`,
      409,
      undefined,
      ERROR_CODES.CONFLICT || 'CONFLICT'
    );
  }

  // 4. Database Foreign Key Violations
  const isForeignKeyViolation =
    err.code === 'ER_ROW_IS_REFERENCED_2' ||
    err.code === 'ER_NO_REFERENCED_ROW_2' ||
    err.code === 'ER_NO_REFERENCED_ROW' ||
    (typeof err.message === 'string' && err.message.includes('FOREIGN KEY constraint failed'));

  if (isForeignKeyViolation) {
    return sendError(
      res,
      'Referenced resource does not exist or is locked by existing relations.',
      400,
      undefined,
      ERROR_CODES.FOREIGN_KEY_VIOLATION || 'FOREIGN_KEY_VIOLATION'
    );
  }

  // 5. JWT / Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(
      res,
      'Invalid authentication token. Please sign in again.',
      401,
      undefined,
      ERROR_CODES.INVALID_TOKEN || 'INVALID_TOKEN'
    );
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(
      res,
      'Authentication token has expired. Please refresh your session.',
      401,
      undefined,
      ERROR_CODES.TOKEN_EXPIRED || 'TOKEN_EXPIRED'
    );
  }

  // 6. Generic or Unhandled Server Errors (Sanitize in production)
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  const code = err.code && typeof err.code === 'string' && isNaN(Number(err.code)) ? err.code : 'INTERNAL_SERVER_ERROR';

  sendError(res, message, statusCode, details, code);
}
