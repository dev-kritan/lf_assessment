"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RsvpController = void 0;
const rsvp_service_1 = require("../services/rsvp.service");
const response_utils_1 = require("../utils/response.utils");
class RsvpController {
    static async setRsvp(req, res, next) {
        try {
            const eventId = parseInt(req.params.id, 10);
            const userId = req.user.userId;
            const { status } = req.body;
            const result = await rsvp_service_1.RsvpService.setRsvp(eventId, userId, status);
            return (0, response_utils_1.sendSuccess)(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    static async getAttendees(req, res, next) {
        try {
            const eventId = parseInt(req.params.id, 10);
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
