"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryEventsSchema = exports.updateEventSchema = exports.createEventSchema = exports.baseEventSchema = void 0;
const zod_1 = require("zod");
exports.baseEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    location: zod_1.z.string().min(2, 'Location is required').max(255),
    event_type: zod_1.z.enum(['public', 'private'], {
        errorMap: () => ({ message: 'Event type must be either public or private' }),
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
    new_tags: zod_1.z.array(zod_1.z.string().min(2).max(50)).optional().default([]),
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
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(9),
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
