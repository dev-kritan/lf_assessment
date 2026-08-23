import { z } from 'zod';

export const baseEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required').max(255),
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
  new_tags: z.array(z.string().min(2).max(50)).optional().default([]),
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
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(9),
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
