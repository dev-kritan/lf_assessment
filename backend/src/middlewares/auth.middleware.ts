import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.utils';
import { sendError } from '../utils/response.utils';
import { AUTH_COOKIES, ERROR_CODES } from '../constants';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies[AUTH_COOKIES.ACCESS_TOKEN]) {
    token = req.cookies[AUTH_COOKIES.ACCESS_TOKEN];
  } else if (req.signedCookies && req.signedCookies[AUTH_COOKIES.ACCESS_TOKEN]) {
    token = req.signedCookies[AUTH_COOKIES.ACCESS_TOKEN];
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please login to continue.', 401, null, ERROR_CODES.UNAUTHORIZED);
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please refresh your token or login again.', 401, null, ERROR_CODES.TOKEN_EXPIRED);
    }
    return sendError(res, 'Invalid authentication token.', 401, null, ERROR_CODES.INVALID_TOKEN);
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies[AUTH_COOKIES.ACCESS_TOKEN]) {
    token = req.cookies[AUTH_COOKIES.ACCESS_TOKEN];
  } else if (req.signedCookies && req.signedCookies[AUTH_COOKIES.ACCESS_TOKEN]) {
    token = req.signedCookies[AUTH_COOKIES.ACCESS_TOKEN];
  }

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch {
      // Ignore token validation failure in optional auth mode
    }
  }

  return next();
}
