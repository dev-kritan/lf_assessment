import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';
import { sendSuccess, sendCreated } from '../utils/response.utils';

export class TagController {
  static async getAllTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { event_type, timeframe, search } = req.query as {
        event_type?: 'all' | 'public' | 'private';
        timeframe?: 'all' | 'upcoming' | 'past';
        search?: string;
      };
      const currentUserId = req.user?.userId;
      const tags = await TagService.getAllTags({ event_type, timeframe, search }, currentUserId);
      return sendSuccess(res, tags, 'Tags retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, colorHex } = req.body;
      const tag = await TagService.createTag(name, colorHex);
      return sendCreated(res, tag, 'Tag created successfully');
    } catch (error) {
      next(error);
    }
  }
}
