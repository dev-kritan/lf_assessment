import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { sendSuccess, sendCreated } from '../utils/response.utils';

export class EventController {
  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user?.userId;
      const result = await EventService.getEvents(req.query as any, currentUserId);
      return sendSuccess(res, result.events, 'Events retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const currentUserId = req.user?.userId;
      const event = await EventService.getEventById(id, currentUserId);
      return sendSuccess(res, event, 'Event details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user!.userId;
      const eventId = await EventService.createEvent(req.body, creatorId);
      const event = await EventService.getEventById(eventId, creatorId);
      return sendCreated(res, event, 'Event created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const currentUserId = req.user!.userId;
      const event = await EventService.updateEvent(id, req.body, currentUserId);
      return sendSuccess(res, event, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const currentUserId = req.user!.userId;
      const result = await EventService.deleteEvent(id, currentUserId);
      return sendSuccess(res, result, 'Event deleted successfully');
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
