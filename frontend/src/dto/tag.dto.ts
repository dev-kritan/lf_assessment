import { z } from 'zod';

export const tagFormSchema = z.object({
  name: z
    .string({ required_error: 'Tag name is required' })
    .trim()
    .min(2, 'Tag name must be at least 2 characters')
    .max(50, 'Tag name cannot exceed 50 characters'),
  colorHex: z
    .string({ required_error: 'Color is required' })
    .trim()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Color must be a valid hex color code (e.g. #6366f1)'),
});

export type TagFormData = z.infer<typeof tagFormSchema>;
