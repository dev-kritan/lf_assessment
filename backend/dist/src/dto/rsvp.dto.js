"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventAttendeeParamSchema = exports.rsvpQuerySchema = exports.setRsvpSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.setRsvpSchema = zod_1.z.object({
    status: zod_1.z.enum(['yes', 'maybe', 'no'], {
        message: "RSVP status must be 'yes', 'maybe', or 'no'",
    }),
});
exports.rsvpQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['all', 'yes', 'maybe', 'no']).optional().default('all'),
    page: zod_1.z.coerce.number().int().positive().default(constants_1.PAGINATION_DEFAULTS.PAGE),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(constants_1.PAGINATION_DEFAULTS.LIMIT),
});
exports.eventAttendeeParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive('Event ID must be a positive integer'),
});
