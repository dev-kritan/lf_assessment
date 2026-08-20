import { Request, Response, NextFunction } from 'express';
import { TwoFactorService } from '../services/twoFactor.service';
import { sendSuccess } from '../utils/response.utils';

export class TwoFactorController {
  static async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await TwoFactorService.generateSecret(userId);
      return sendSuccess(res, result, '2FA setup initialized');
    } catch (error) {
      next(error);
    }
  }

  static async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;
      const result = await TwoFactorService.verifyAndEnable(userId, token);
      return sendSuccess(res, result, '2FA enabled successfully');
    } catch (error) {
      next(error);
    }
  }

  static async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { token } = req.body;
      const result = await TwoFactorService.disable(userId, token);
      return sendSuccess(res, result, '2FA disabled successfully');
    } catch (error) {
      next(error);
    }
  }
}
