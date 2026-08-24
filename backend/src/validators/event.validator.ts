import { z } from 'zod';
import { VALIDATION_LIMITS, PAGINATION_DEFAULTS } from '../constants';

export const baseEventSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_LIMITS.EVENT_TITLE_MIN, `Title must be at least ${VALIDATION_LIMITS.EVENT_TITLE_MIN} characters`)
    .max(VALIDATION_LIMITS.EVENT_TITLE_MAX),
  description: z
    .string()
    .min(VALIDATION_LIMITS.EVENT_DESC_MIN, `Description must be at least ${VALIDATION_LIMITS.EVENT_DESC_MIN} characters`),
  location: z
    .string()
    .min(VALIDATION_LIMITS.EVENT_LOC_MIN, 'Location is required')
    .max(VALIDATION_LIMITS.EVENT_LOC_MAX),
  event_type: z.enum(['public', 'private'], {
    errorMap: () => ({ message: 'Event type must be either public or private' }),
  }),
  is_true_private: z.boolean().optional(),
  start_time: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time format',
  }),
  end_time: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end time format',
    })
    .optional()
    .nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  banner_url: z.string().url().optional().nullable().or(z.literal('')),
  tag_ids: z.array(z.number().int().positive()).optional().default([]),
  new_tags: z
    .array(z.string().min(VALIDATION_LIMITS.TAG_NAME_MIN).max(VALIDATION_LIMITS.TAG_NAME_MAX))
    .optional()
    .default([]),
});

export const createEventSchema = baseEventSchema.refine(
  (data) => {
    if (data.end_time && data.start_time) {
      return new Date(data.end_time) >= new Date(data.start_time);
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
);

export const updateEventSchema = baseEventSchema.partial();

export const queryEventsSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION_DEFAULTS.PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION_DEFAULTS.MAX_LIMIT)
    .default(PAGINATION_DEFAULTS.LIMIT),
  search: z.string().optional().default(''),
  tag: z.string().optional(),
  tag_id: z.coerce.number().int().positive().optional(),
  event_type: z.enum(['all', 'public', 'private']).default('all'),
  timeframe: z.enum(['all', 'upcoming', 'past']).default('all'),
  sort_by: z.enum(['date', 'popularity', 'created_at']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  creator_id: z.coerce.number().int().positive().optional(),
  my_rsvps: z.enum(['all', 'yes', 'maybe', 'no']).optional(),
});
