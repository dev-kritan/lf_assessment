import { Request, Response, NextFunction } from 'express';
import { BonusService } from '../services/bonus.service';
import { sendSuccess } from '../utils/response.utils';

export class BonusController {
  static async getBonusData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await BonusService.getRawTables();
      return sendSuccess(res, data, 'Bonus raw table data retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async executeQ1(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BonusService.runQ1();
      return sendSuccess(res, result, 'Query Q1 executed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async executeQ2(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BonusService.runQ2();
      return sendSuccess(res, result, 'Query Q2 executed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async executeQ4(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BonusService.runQ4();
      return sendSuccess(res, result, 'Query Q4 executed successfully');
    } catch (error) {
      next(error);
    }
  }
}
