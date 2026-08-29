"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const event_service_1 = require("../services/event.service");
const response_utils_1 = require("../utils/response.utils");
const dto_1 = require("../dto");
class EventController {
    static async getEvents(req, res, next) {
        try {
            const queryValidation = (0, dto_1.validateDto)(dto_1.queryEventsSchema, req.query);
            if (!queryValidation.success) {
                return (0, response_utils_1.sendError)(res, queryValidation.message, queryValidation.statusCode, queryValidation.errors, queryValidation.code);
            }
            const currentUserId = req.user?.userId;
            const isVerified = Boolean(req.user?.isEmailVerified);
            const result = await event_service_1.EventService.getEvents(queryValidation.data, currentUserId, isVerified);
            return (0, response_utils_1.sendSuccess)(res, result.events, 'Events retrieved successfully', 200, result.pagination);
        }
        catch (error) {
            next(error);
        }
    }
    static async getEventById(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.eventIdParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const id = paramValidation.data.id;
            const currentUserId = req.user?.userId;
            const isVerified = Boolean(req.user?.isEmailVerified);
            const event = await event_service_1.EventService.getEventById(id, currentUserId, isVerified);
            return (0, response_utils_1.sendSuccess)(res, event, 'Event details retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async createEvent(req, res, next) {
        try {
            const bodyValidation = (0, dto_1.validateDto)(dto_1.createEventSchema, req.body);
            if (!bodyValidation.success) {
                return (0, response_utils_1.sendError)(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
            }
            const creatorId = req.user.userId;
            const eventId = await event_service_1.EventService.createEvent(bodyValidation.data, creatorId);
            const event = await event_service_1.EventService.getEventById(eventId, creatorId, true);
            return (0, response_utils_1.sendCreated)(res, event, 'Event created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async updateEvent(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.eventIdParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const bodyValidation = (0, dto_1.validateDto)(dto_1.updateEventSchema, req.body);
            if (!bodyValidation.success) {
                return (0, response_utils_1.sendError)(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
            }
            const id = paramValidation.data.id;
            const currentUserId = req.user.userId;
            const event = await event_service_1.EventService.updateEvent(id, bodyValidation.data, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, event, 'Event updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteEvent(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.eventIdParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const id = paramValidation.data.id;
            const currentUserId = req.user.userId;
            const result = await event_service_1.EventService.deleteEvent(id, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, result, 'Event deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async bulkDeleteEvents(req, res, next) {
        try {
            const bodyValidation = (0, dto_1.validateDto)(dto_1.bulkDeleteEventsSchema, req.body);
            if (!bodyValidation.success) {
                return (0, response_utils_1.sendError)(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
            }
            const currentUserId = req.user.userId;
            const { event_ids } = bodyValidation.data;
            const result = await event_service_1.EventService.bulkDeleteEvents(event_ids, currentUserId);
            return (0, response_utils_1.sendSuccess)(res, result, result.message);
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
