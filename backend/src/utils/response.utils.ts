import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: any
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(payload);
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message || 'Resource created successfully', 201);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  details?: any,
  code?: string
): Response {
  const payload: ApiResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(payload);
}
