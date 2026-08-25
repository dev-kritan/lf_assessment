import { z } from 'zod';
import { VALIDATION_LIMITS, REGEX_PATTERNS } from '../constants';

export const createTagSchema = z.object({
  name: z
    .string({ required_error: 'Tag name is required' })
    .trim()
    .min(VALIDATION_LIMITS.TAG_NAME_MIN, `Tag name must be at least ${VALIDATION_LIMITS.TAG_NAME_MIN} characters`)
    .max(VALIDATION_LIMITS.TAG_NAME_MAX, `Tag name cannot exceed ${VALIDATION_LIMITS.TAG_NAME_MAX} characters`),
  colorHex: z
    .string()
    .regex(REGEX_PATTERNS.HEX_COLOR, 'Color must be a valid hex color (e.g. #6366f1)')
    .optional(),
});

export type CreateTagDTO = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(VALIDATION_LIMITS.TAG_NAME_MIN, `Tag name must be at least ${VALIDATION_LIMITS.TAG_NAME_MIN} characters`)
    .max(VALIDATION_LIMITS.TAG_NAME_MAX, `Tag name cannot exceed ${VALIDATION_LIMITS.TAG_NAME_MAX} characters`)
    .optional(),
  colorHex: z
    .string()
    .regex(REGEX_PATTERNS.HEX_COLOR, 'Color must be a valid hex color (e.g. #6366f1)')
    .optional(),
});

export type UpdateTagDTO = z.infer<typeof updateTagSchema>;

export const tagQuerySchema = z.object({
  event_type: z.enum(['all', 'public', 'private']).optional().default('all'),
  timeframe: z.enum(['all', 'upcoming', 'past']).optional().default('all'),
  search: z.string().trim().optional(),
});

export type TagQueryDTO = z.infer<typeof tagQuerySchema>;

export const tagIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Tag ID must be a positive integer'),
});

export type TagIdParamDTO = z.infer<typeof tagIdParamSchema>;
