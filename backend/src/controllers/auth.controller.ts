import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.utils';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.utils';
import { config } from '../config/env';
import {
  validateDto,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  emailVerifySchema,
  resendVerificationSchema,
} from '../dto';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateDto(registerSchema, req.body);
      if (!validation.success) {
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.register(validation.data);
      return sendCreated(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateDto(loginSchema, req.body);
      if (!validation.success) {
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.login(validation.data);
      if (result.accessToken) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
      }
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required.', 401, null, 'REFRESH_TOKEN_REQUIRED');
      }

      const validation = validateDto(refreshTokenSchema, { refreshToken });
      if (!validation.success) {
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.refreshAccessToken(refreshToken);
      if (result.accessToken) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
      }
      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await AuthService.logout(refreshToken);
      clearAuthCookies(res);
      return sendSuccess(res, result, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await AuthService.getProfile(userId);
      return sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supports both GET (direct link / browser click) and POST (SPA API calls).
   * For browser GET navigation, redirects to the frontend with verification status.
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const isGet = req.method === 'GET';
      const token = (isGet ? req.query.token : req.body?.token) as string;
      const uidRaw = (isGet ? req.query.uid : req.body?.uid);
      const uid = uidRaw ? parseInt(String(uidRaw), 10) : undefined;

      const validation = validateDto(emailVerifySchema, { token, uid });
      if (!validation.success) {
        if (isGet && req.accepts('html') && !req.xhr) {
          return res.redirect(`${config.clientUrl}/verify-email?status=error&message=${encodeURIComponent(validation.message)}`);
        }
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.verifyEmail(validation.data.token, validation.data.uid);

      if (isGet && req.accepts('html') && !req.xhr) {
        const queryStatus = result.alreadyVerified ? 'already-verified' : 'success';
        return res.redirect(`${config.clientUrl}/verify-email?status=${queryStatus}&message=${encodeURIComponent(result.message)}`);
      }

      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      if (req.method === 'GET' && req.accepts('html') && !req.xhr) {
        const errorMsg = error.message || 'Verification failed.';
        return res.redirect(`${config.clientUrl}/verify-email?status=error&message=${encodeURIComponent(errorMsg)}`);
      }
      next(error);
    }
  }

  /**
   * Resends verification email with rate limiting.
   */
  static async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateDto(resendVerificationSchema, req.body);
      if (!validation.success) {
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.resendVerification(validation.data.email);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async requestEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await AuthService.generateEmailVerification(userId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}
