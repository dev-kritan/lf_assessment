import { z } from 'zod';

export const setRsvpSchema = z.object({
  status: z.enum(['yes', 'no', 'maybe'], {
    message: 'RSVP status must be yes, no, or maybe',
  }),
});

export const bulkDeleteRsvpsSchema = z.object({
  event_ids: z
    .array(z.coerce.number().int().positive('Each event ID must be a positive integer'))
    .min(1, 'At least one event ID is required'),
});

