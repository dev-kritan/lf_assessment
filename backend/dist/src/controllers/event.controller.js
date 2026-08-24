"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const event_service_1 = require("../services/event.service");
const response_utils_1 = require("../utils/response.utils");
class EventController {
    static async getEvents(req, res, next) {
        try {
            const currentUserId = req.user?.userId;
            const result = await event_service_1.EventService.getEvents(req.query, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, result.events, 'Events retrieved successfully', 200, result.pagination);
        }
        catch (error) {
            next(error);
        }
    }
    static async getEventById(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const currentUserId = req.user?.userId;
            const event = await event_service_1.EventService.getEventById(id, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, event, 'Event details retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async createEvent(req, res, next) {
        try {
            const creatorId = req.user.userId;
            const eventId = await event_service_1.EventService.createEvent(req.body, creatorId);
            const event = await event_service_1.EventService.getEventById(eventId, creatorId);
            return (0, response_utils_1.sendCreated)(res, event, 'Event created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async updateEvent(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const currentUserId = req.user.userId;
            const event = await event_service_1.EventService.updateEvent(id, req.body, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, event, 'Event updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteEvent(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const currentUserId = req.user.userId;
            const result = await event_service_1.EventService.deleteEvent(id, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, result, 'Event deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getMetrics(req, res, next) {
        try {
            const metrics = await event_service_1.EventService.getEventMetrics();
            return (0, response_utils_1.sendSuccess)(res, metrics, 'Event metrics retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.EventController = EventController;
