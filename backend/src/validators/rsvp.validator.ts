import { z } from 'zod';

export const setRsvpSchema = z.object({
  status: z.enum(['yes', 'no', 'maybe'], {
    message: 'RSVP status must be yes, no, or maybe',
  }),
});
