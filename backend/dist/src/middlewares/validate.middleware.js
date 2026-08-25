"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const response_utils_1 = require("../utils/response.utils");
function validate(schema, source = 'body') {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync(req[source]);
            req[source] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const issues = error.issues || error.errors || [];
                const formattedErrors = issues.map((err) => ({
                    field: err.path && err.path.length > 0 ? err.path.join('.') : source,
                    message: err.message,
                }));
                return (0, response_utils_1.sendError)(res, 'Validation failed', 400, formattedErrors, 'VALIDATION_ERROR');
            }
            return (0, response_utils_1.sendError)(res, 'Invalid request data', 400, error);
        }
    };
}
