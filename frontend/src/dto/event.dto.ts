import { z } from 'zod';

export const eventFormSchema = z
  .object({
    title: z
      .string({ message: 'Event title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title cannot exceed 255 characters'),
    description: z
      .string({ message: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters'),
    location: z
      .string({ message: 'Location is required' })
      .trim()
      .min(2, 'Location must be at least 2 characters')
      .max(255, 'Location cannot exceed 255 characters'),
    eventType: z.enum(['public', 'private'], {
      message: 'Event type must be either public or private',
    }),
    isTruePrivate: z.boolean().optional().default(false),
    startTime: z
      .string({ message: 'Start time is required' })
      .min(1, 'Start time is required')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Please provide a valid start date and time',
      }),
    endTime: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Please provide a valid end date and time',
      }),
    capacity: z
      .union([
        z.number().int().positive('Capacity must be a positive integer'),
        z.string().transform((val) => {
          if (!val || val.trim() === '') return undefined;
          const num = parseInt(val, 10);
          return isNaN(num) ? undefined : num;
        }),
      ])
      .optional()
      .nullable()
      .refine((val) => val === undefined || val === null || val > 0, {
        message: 'Capacity must be a positive number greater than 0',
      }),
    bannerUrl: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || val.trim() === '' || /^https?:\/\/.+/.test(val), {
        message: 'Banner URL must be a valid http or https URL',
      }),
    tagIds: z.array(z.number()).optional().default([]),
    tags: z.array(z.string().trim()).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime && data.endTime.trim() !== '') {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type EventFormData = z.infer<typeof eventFormSchema>;
