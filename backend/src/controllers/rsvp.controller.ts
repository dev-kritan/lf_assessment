import { Request, Response, NextFunction } from 'express';
import { RsvpService } from '../services/rsvp.service';
import { sendSuccess } from '../utils/response.utils';

export class RsvpController {
  static async setRsvp(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const userId = req.user!.userId;
      const { status } = req.body;
      const result = await RsvpService.setRsvp(eventId, userId, status);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = parseInt(req.params.id, 10);
      const attendees = await RsvpService.getAttendees(eventId);
      return sendSuccess(res, attendees, 'Attendees retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMyRsvps(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const rsvps = await RsvpService.getUserRsvps(userId);
      return sendSuccess(res, rsvps, 'User RSVPs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
