import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.utils';
import { sendError } from '../utils/response.utils';

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
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.signedCookies && req.signedCookies.accessToken) {
    token = req.signedCookies.accessToken;
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please login to continue.', 401, null, 'UNAUTHORIZED');
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please refresh your token or login again.', 401, null, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid authentication token.', 401, null, 'INVALID_TOKEN');
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.signedCookies && req.signedCookies.accessToken) {
    token = req.signedCookies.accessToken;
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
