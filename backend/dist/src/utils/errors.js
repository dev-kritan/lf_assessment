"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    isOperational;
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad Request', details) {
        super(message, 400, 'BAD_REQUEST', details);
    }
}
exports.BadRequestError = BadRequestError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access', details) {
        super(message, 401, 'UNAUTHORIZED', details);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden: Access denied', details) {
        super(message, 403, 'FORBIDDEN', details);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details) {
        super(message, 404, 'NOT_FOUND', details);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists or conflict detected', details) {
        super(message, 409, 'CONFLICT', details);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests, please try again later.', details) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
    }
}
exports.RateLimitError = RateLimitError;
