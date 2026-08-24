"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRsvpSchema = void 0;
const zod_1 = require("zod");
exports.setRsvpSchema = zod_1.z.object({
    status: zod_1.z.enum(['yes', 'no', 'maybe'], {
        errorMap: () => ({ message: 'RSVP status must be yes, no, or maybe' }),
    }),
});
