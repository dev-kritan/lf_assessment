"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = void 0;
exports.validateDto = validateDto;
const zod_1 = require("zod");
/**
 * Validates any payload against a Zod schema synchronously.
 * Returns a typed success object or a structured failure with field-level errors.
 */
function validateDto(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const formattedErrors = (result.error?.issues || result.error?.errors || []).map((err) => ({
            field: err.path && err.path.length > 0 ? err.path.join('.') : 'body',
            message: err.message,
        }));
        return {
            success: false,
            errors: formattedErrors,
            message: formattedErrors.length === 1 ? formattedErrors[0].message : 'Validation failed',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
        };
    }
    return {
        success: true,
        data: result.data,
    };
}
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive('ID must be a positive integer'),
});
