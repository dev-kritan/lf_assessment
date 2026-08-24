"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const response_utils_1 = require("../utils/response.utils");
function errorHandler(err, req, res, next) {
    logger_1.logger.error(`${req.method} ${req.originalUrl} - Error:`, err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';
    const details = process.env.NODE_ENV === 'development' ? err.stack : undefined;
    const code = err.code || 'SERVER_ERROR';
    (0, response_utils_1.sendError)(res, message, statusCode, details, code);
}
