"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RsvpController = void 0;
const rsvp_service_1 = require("../services/rsvp.service");
const response_utils_1 = require("../utils/response.utils");
const dto_1 = require("../dto");
class RsvpController {
    static async setRsvp(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.eventAttendeeParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const bodyValidation = (0, dto_1.validateDto)(dto_1.setRsvpSchema, req.body);
            if (!bodyValidation.success) {
                return (0, response_utils_1.sendError)(res, bodyValidation.message, bodyValidation.statusCode, bodyValidation.errors, bodyValidation.code);
            }
            const eventId = paramValidation.data.id;
            const userId = req.user.userId;
            const { status } = bodyValidation.data;
            const result = await rsvp_service_1.RsvpService.setRsvp(eventId, userId, status);
            return (0, response_utils_1.sendSuccess)(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    static async getAttendees(req, res, next) {
        try {
            const paramValidation = (0, dto_1.validateDto)(dto_1.eventAttendeeParamSchema, req.params);
            if (!paramValidation.success) {
                return (0, response_utils_1.sendError)(res, paramValidation.message, paramValidation.statusCode, paramValidation.errors, paramValidation.code);
            }
            const eventId = paramValidation.data.id;
            const attendees = await rsvp_service_1.RsvpService.getAttendees(eventId);
            return (0, response_utils_1.sendSuccess)(res, attendees, 'Attendees retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getMyRsvps(req, res, next) {
        try {
            const userId = req.user.userId;
            const rsvps = await rsvp_service_1.RsvpService.getUserRsvps(userId);
            return (0, response_utils_1.sendSuccess)(res, rsvps, 'User RSVPs retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RsvpController = RsvpController;
