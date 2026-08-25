"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryEventsSchema = exports.updateEventSchema = exports.createEventSchema = exports.baseEventSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.baseEventSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(constants_1.VALIDATION_LIMITS.EVENT_TITLE_MIN, `Title must be at least ${constants_1.VALIDATION_LIMITS.EVENT_TITLE_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.EVENT_TITLE_MAX),
    description: zod_1.z
        .string()
        .min(constants_1.VALIDATION_LIMITS.EVENT_DESC_MIN, `Description must be at least ${constants_1.VALIDATION_LIMITS.EVENT_DESC_MIN} characters`),
    location: zod_1.z
        .string()
        .min(constants_1.VALIDATION_LIMITS.EVENT_LOC_MIN, 'Location is required')
        .max(constants_1.VALIDATION_LIMITS.EVENT_LOC_MAX),
    event_type: zod_1.z.enum(['public', 'private'], {
        message: 'Event type must be either public or private',
    }),
    is_true_private: zod_1.z.boolean().optional(),
    start_time: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid start time format',
    }),
    end_time: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid end time format',
    })
        .optional()
        .nullable(),
    capacity: zod_1.z.number().int().positive().optional().nullable(),
    banner_url: zod_1.z.string().url().optional().nullable().or(zod_1.z.literal('')),
    tag_ids: zod_1.z.array(zod_1.z.number().int().positive()).optional().default([]),
    new_tags: zod_1.z
        .array(zod_1.z.string().min(constants_1.VALIDATION_LIMITS.TAG_NAME_MIN).max(constants_1.VALIDATION_LIMITS.TAG_NAME_MAX))
        .optional()
        .default([]),
});
exports.createEventSchema = exports.baseEventSchema.refine((data) => {
    if (data.end_time && data.start_time) {
        return new Date(data.end_time) >= new Date(data.start_time);
    }
    return true;
}, {
    message: 'End time must be after start time',
    path: ['end_time'],
});
exports.updateEventSchema = exports.baseEventSchema.partial();
exports.queryEventsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(constants_1.PAGINATION_DEFAULTS.PAGE),
    limit: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .max(constants_1.PAGINATION_DEFAULTS.MAX_LIMIT)
        .default(constants_1.PAGINATION_DEFAULTS.LIMIT),
    search: zod_1.z.string().optional().default(''),
    tag: zod_1.z.string().optional(),
    tag_id: zod_1.z.coerce.number().int().positive().optional(),
    event_type: zod_1.z.enum(['all', 'public', 'private']).default('all'),
    timeframe: zod_1.z.enum(['all', 'upcoming', 'past']).default('all'),
    sort_by: zod_1.z.enum(['date', 'popularity', 'created_at']).default('date'),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('asc'),
    creator_id: zod_1.z.coerce.number().int().positive().optional(),
    my_rsvps: zod_1.z.enum(['all', 'yes', 'maybe', 'no']).optional(),
});
