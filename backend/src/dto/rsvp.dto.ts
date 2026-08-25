import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '../constants';

export const setRsvpSchema = z.object({
  status: z.enum(['yes', 'maybe', 'no'], {
    message: "RSVP status must be 'yes', 'maybe', or 'no'",
  }),
});

export type SetRsvpDTO = z.infer<typeof setRsvpSchema>;

export const rsvpQuerySchema = z.object({
  status: z.enum(['all', 'yes', 'maybe', 'no']).optional().default('all'),
  page: z.coerce.number().int().positive().default(PAGINATION_DEFAULTS.PAGE),
  limit: z.coerce.number().int().positive().max(100).default(PAGINATION_DEFAULTS.LIMIT),
});

export type RsvpQueryDTO = z.infer<typeof rsvpQuerySchema>;

export const eventAttendeeParamSchema = z.object({
  id: z.coerce.number().int().positive('Event ID must be a positive integer'),
});

export type EventAttendeeParamDTO = z.infer<typeof eventAttendeeParamSchema>;
