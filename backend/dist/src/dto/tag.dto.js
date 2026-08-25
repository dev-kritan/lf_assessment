"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagIdParamSchema = exports.tagQuerySchema = exports.updateTagSchema = exports.createTagSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.createTagSchema = zod_1.z.object({
    name: zod_1.z
        .string({ message: 'Tag name is required' })
        .trim()
        .min(constants_1.VALIDATION_LIMITS.TAG_NAME_MIN, `Tag name must be at least ${constants_1.VALIDATION_LIMITS.TAG_NAME_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.TAG_NAME_MAX, `Tag name cannot exceed ${constants_1.VALIDATION_LIMITS.TAG_NAME_MAX} characters`),
    colorHex: zod_1.z
        .string()
        .regex(constants_1.REGEX_PATTERNS.HEX_COLOR, 'Color must be a valid hex color (e.g. #6366f1)')
        .optional(),
});
exports.updateTagSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(constants_1.VALIDATION_LIMITS.TAG_NAME_MIN, `Tag name must be at least ${constants_1.VALIDATION_LIMITS.TAG_NAME_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.TAG_NAME_MAX, `Tag name cannot exceed ${constants_1.VALIDATION_LIMITS.TAG_NAME_MAX} characters`)
        .optional(),
    colorHex: zod_1.z
        .string()
        .regex(constants_1.REGEX_PATTERNS.HEX_COLOR, 'Color must be a valid hex color (e.g. #6366f1)')
        .optional(),
});
exports.tagQuerySchema = zod_1.z.object({
    event_type: zod_1.z.enum(['all', 'public', 'private']).optional().default('all'),
    timeframe: zod_1.z.enum(['all', 'upcoming', 'past']).optional().default('all'),
    search: zod_1.z.string().trim().optional(),
});
exports.tagIdParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive('Tag ID must be a positive integer'),
});
