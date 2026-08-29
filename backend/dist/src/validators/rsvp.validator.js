"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteRsvpsSchema = exports.setRsvpSchema = void 0;
const zod_1 = require("zod");
exports.setRsvpSchema = zod_1.z.object({
    status: zod_1.z.enum(['yes', 'no', 'maybe'], {
        message: 'RSVP status must be yes, no, or maybe',
    }),
});
exports.bulkDeleteRsvpsSchema = zod_1.z.object({
    event_ids: zod_1.z
        .array(zod_1.z.coerce.number().int().positive('Each event ID must be a positive integer'))
        .min(1, 'At least one event ID is required'),
});
