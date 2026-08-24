"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendCreated = sendCreated;
exports.sendError = sendError;
function sendSuccess(res, data, message, statusCode = 200, meta) {
    const payload = {
        success: true,
        ...(message && { message }),
        data,
        ...(meta && { meta }),
    };
    return res.status(statusCode).json(payload);
}
function sendCreated(res, data, message) {
    return sendSuccess(res, data, message || 'Resource created successfully', 201);
}
function sendError(res, message, statusCode = 400, details, code) {
    const payload = {
        success: false,
        error: {
            message,
            ...(code && { code }),
            ...(details && { details }),
        },
    };
    return res.status(statusCode).json(payload);
}
