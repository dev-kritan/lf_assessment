import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.utils';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.utils';
import {
  validateDto,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  emailVerifySchema,
} from '../dto';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateDto(registerSchema, req.body);
      if (!validation.success) {
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.register(validation.data);
      if (result.accessToken) {
        setAuthCookies(res, result.accessToken, result.refreshToken);
      }
      return sendCreated(res, result, 'User registered successfully');
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

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateDto(emailVerifySchema, req.body);
      if (!validation.success) {
        return sendError(res, validation.message, validation.statusCode, validation.errors, validation.code);
      }

      const result = await AuthService.verifyEmail(validation.data.token);
      return sendSuccess(res, result, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async requestEmailVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await AuthService.generateEmailVerification(userId);
      return sendSuccess(res, result, 'Verification token generated');
    } catch (error) {
      next(error);
    }
  }
}
