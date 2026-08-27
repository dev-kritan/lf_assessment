import { Request, Response, NextFunction } from 'express';
import { RsvpService } from '../services/rsvp.service';
import { sendSuccess, sendError } from '../utils/response.utils';
import {
  validateDto,
  setRsvpSchema,
  eventAttendeeParamSchema,
  bulkDeleteRsvpsSchema,
} from '../dto';

export class RsvpController {
  static async setRsvp(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(eventAttendeeParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const bodyValidation = validateDto(setRsvpSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const eventId = paramValidation.data.id;
      const userId = req.user!.userId;
      const { status } = bodyValidation.data;
      const result = await RsvpService.setRsvp(eventId, userId, status);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRsvp(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(eventAttendeeParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const eventId = paramValidation.data.id;
      const userId = req.user!.userId;
      const result = await RsvpService.deleteRsvp(eventId, userId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async bulkDeleteRsvps(req: Request, res: Response, next: NextFunction) {
    try {
      const bodyValidation = validateDto(bulkDeleteRsvpsSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const userId = req.user!.userId;
      const { event_ids } = bodyValidation.data;
      const result = await RsvpService.bulkDeleteRsvps(event_ids, userId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(eventAttendeeParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const eventId = paramValidation.data.id;
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

