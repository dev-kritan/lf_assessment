import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.utils';
import {
  validateDto,
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
  eventIdParamSchema,
  bulkDeleteEventsSchema,
} from '../dto';

export class EventController {
  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const queryValidation = validateDto(queryEventsSchema, req.query);
      if (!queryValidation.success) {
        return sendError(res, queryValidation.message, queryValidation.statusCode, queryValidation.errors, queryValidation.code);
      }

      const currentUserId = req.user?.userId;
      const isVerified = Boolean(req.user?.isEmailVerified);
      const result = await EventService.getEvents(queryValidation.data, currentUserId, isVerified);
      return sendSuccess(res, result.events, 'Events retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(eventIdParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const id = paramValidation.data.id;
      const currentUserId = req.user?.userId;
      const isVerified = Boolean(req.user?.isEmailVerified);
      const event = await EventService.getEventById(id, currentUserId, isVerified);
      return sendSuccess(res, event, 'Event details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const bodyValidation = validateDto(createEventSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const creatorId = req.user!.userId;
      const eventId = await EventService.createEvent(bodyValidation.data, creatorId);
      const event = await EventService.getEventById(eventId, creatorId, true);
      return sendCreated(res, event, 'Event created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(eventIdParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const bodyValidation = validateDto(updateEventSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const id = paramValidation.data.id;
      const currentUserId = req.user!.userId;
      const event = await EventService.updateEvent(id, bodyValidation.data, currentUserId);
      return sendSuccess(res, event, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const paramValidation = validateDto(eventIdParamSchema, req.params);
      if (!paramValidation.success) {
        return sendError(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
      }

      const id = paramValidation.data.id;
      const currentUserId = req.user!.userId;
      const result = await EventService.deleteEvent(id, currentUserId);
      return sendSuccess(res, result, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkDeleteEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const bodyValidation = validateDto(bulkDeleteEventsSchema, req.body);
      if (!bodyValidation.success) {
        return sendError(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
      }

      const currentUserId = req.user!.userId;
      const { event_ids } = bodyValidation.data;
      const result = await EventService.bulkDeleteEvents(event_ids, currentUserId);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await EventService.getEventMetrics();
      return sendSuccess(res, metrics, 'Event metrics retrieved');
    } catch (error) {
      next(error);
    }
  }
}

