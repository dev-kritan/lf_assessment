import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.utils';
import { setAuthCookies, clearAuthCookies } from '../utils/cookie.utils';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
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
      const result = await AuthService.login(req.body);
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
      const { token } = req.body;
      const result = await AuthService.verifyEmail(token);
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
