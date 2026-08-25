import { z } from 'zod';
import { VALIDATION_LIMITS, PAGINATION_DEFAULTS } from '../constants';
import { CreateEventInput, EventQueryParams } from '../services/event.service';

export const baseEventSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(VALIDATION_LIMITS.EVENT_TITLE_MIN, `Title must be at least ${VALIDATION_LIMITS.EVENT_TITLE_MIN} characters`)
    .max(VALIDATION_LIMITS.EVENT_TITLE_MAX, `Title cannot exceed ${VALIDATION_LIMITS.EVENT_TITLE_MAX} characters`),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(VALIDATION_LIMITS.EVENT_DESC_MIN, `Description must be at least ${VALIDATION_LIMITS.EVENT_DESC_MIN} characters`),
  location: z
    .string({ required_error: 'Location is required' })
    .trim()
    .min(VALIDATION_LIMITS.EVENT_LOC_MIN, `Location must be at least ${VALIDATION_LIMITS.EVENT_LOC_MIN} characters`)
    .max(VALIDATION_LIMITS.EVENT_LOC_MAX, `Location cannot exceed ${VALIDATION_LIMITS.EVENT_LOC_MAX} characters`),
  event_type: z.enum(['public', 'private'], {
    errorMap: () => ({ message: 'Event type must be either public or private' }),
  }),
  is_true_private: z.boolean().optional().default(false),
  start_time: z.string({ required_error: 'Start time is required' }).refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time format',
  }),
  end_time: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end time format',
    })
    .optional()
    .nullable(),
  capacity: z.number().int().positive('Capacity must be a positive integer').optional().nullable(),
  banner_url: z.string().url('Banner URL must be a valid URL').optional().nullable().or(z.literal('')),
  tag_ids: z.array(z.number().int().positive()).optional().default([]),
  new_tags: z
    .array(z.string().min(VALIDATION_LIMITS.TAG_NAME_MIN).max(VALIDATION_LIMITS.TAG_NAME_MAX))
    .optional()
    .default([]),
});

export const createEventSchema: z.ZodType<CreateEventInput, z.ZodTypeDef, any> = z
  .preprocess((raw: any) => {
    if (typeof raw !== 'object' || raw === null) return raw;
    const transformed: any = { ...raw };
    if (transformed.eventType !== undefined && transformed.event_type === undefined) {
      transformed.event_type = transformed.eventType;
    }
    if (transformed.startTime !== undefined && transformed.start_time === undefined) {
      transformed.start_time = transformed.startTime;
    }
    if (transformed.endTime !== undefined && transformed.end_time === undefined) {
      transformed.end_time = transformed.endTime;
    }
    if (transformed.isTruePrivate !== undefined && transformed.is_true_private === undefined) {
      transformed.is_true_private = transformed.isTruePrivate;
    }
    if (transformed.bannerUrl !== undefined && transformed.banner_url === undefined) {
      transformed.banner_url = transformed.bannerUrl;
    }
    if (transformed.tagIds !== undefined && transformed.tag_ids === undefined) {
      transformed.tag_ids = transformed.tagIds;
    }
    if (transformed.tags !== undefined && transformed.new_tags === undefined) {
      transformed.new_tags = transformed.tags;
    }
    if (typeof transformed.capacity === 'string' && transformed.capacity.trim() !== '') {
      transformed.capacity = parseInt(transformed.capacity, 10);
    }
    return transformed;
  }, baseEventSchema)
  .refine(
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

export type CreateEventDTO = CreateEventInput;

export const updateEventSchema: z.ZodType<Partial<CreateEventInput>, z.ZodTypeDef, any> = z
  .preprocess((raw: any) => {
    if (typeof raw !== 'object' || raw === null) return raw;
    const transformed: any = { ...raw };
    if (transformed.eventType !== undefined && transformed.event_type === undefined) {
      transformed.event_type = transformed.eventType;
    }
    if (transformed.startTime !== undefined && transformed.start_time === undefined) {
      transformed.start_time = transformed.startTime;
    }
    if (transformed.endTime !== undefined && transformed.end_time === undefined) {
      transformed.end_time = transformed.endTime;
    }
    if (transformed.isTruePrivate !== undefined && transformed.is_true_private === undefined) {
      transformed.is_true_private = transformed.isTruePrivate;
    }
    if (transformed.bannerUrl !== undefined && transformed.banner_url === undefined) {
      transformed.banner_url = transformed.bannerUrl;
    }
    if (transformed.tagIds !== undefined && transformed.tag_ids === undefined) {
      transformed.tag_ids = transformed.tagIds;
    }
    if (transformed.tags !== undefined && transformed.new_tags === undefined) {
      transformed.new_tags = transformed.tags;
    }
    if (typeof transformed.capacity === 'string' && transformed.capacity.trim() !== '') {
      transformed.capacity = parseInt(transformed.capacity, 10);
    }
    return transformed;
  }, baseEventSchema.partial())
  .refine(
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

export type UpdateEventDTO = Partial<CreateEventInput>;

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

export type QueryEventsDTO = EventQueryParams;

export const eventIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

export type EventIdParamDTO = z.infer<typeof eventIdParamSchema>;
