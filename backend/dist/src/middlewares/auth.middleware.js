"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.requireVerified = requireVerified;
const token_utils_1 = require("../utils/token.utils");
const response_utils_1 = require("../utils/response.utils");
const constants_1 = require("../constants");
const knex_1 = __importDefault(require("../config/knex"));
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.cookies && req.cookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN]) {
        token = req.cookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN];
    }
    else if (req.signedCookies && req.signedCookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN]) {
        token = req.signedCookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN];
    }
    if (!token) {
        return (0, response_utils_1.sendError)(res, 'Authentication required. Please login to continue.', 401, null, constants_1.ERROR_CODES.UNAUTHORIZED);
    }
    try {
        const payload = (0, token_utils_1.verifyAccessToken)(token);
        req.user = payload;
        const user = await (0, knex_1.default)(constants_1.DB_TABLES.USERS)
            .where({ id: payload.userId })
            .select('is_email_verified')
            .first();
        if (user) {
            req.user.isEmailVerified = Boolean(user.is_email_verified);
        }
        return next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return (0, response_utils_1.sendError)(res, 'Session expired. Please refresh your token or login again.', 401, null, constants_1.ERROR_CODES.TOKEN_EXPIRED);
        }
        return (0, response_utils_1.sendError)(res, 'Invalid authentication token.', 401, null, constants_1.ERROR_CODES.INVALID_TOKEN);
    }
}
async function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.cookies && req.cookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN]) {
        token = req.cookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN];
    }
    else if (req.signedCookies && req.signedCookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN]) {
        token = req.signedCookies[constants_1.AUTH_COOKIES.ACCESS_TOKEN];
    }
    if (token) {
        try {
            const payload = (0, token_utils_1.verifyAccessToken)(token);
            req.user = payload;
            const user = await (0, knex_1.default)(constants_1.DB_TABLES.USERS)
                .where({ id: payload.userId })
                .select('is_email_verified')
                .first();
            if (user) {
                req.user.isEmailVerified = Boolean(user.is_email_verified);
            }
        }
        catch {
            // Ignore token validation failure in optional auth mode
        }
    }
    return next();
}
async function requireVerified(req, res, next) {
    if (!req.user) {
        return (0, response_utils_1.sendError)(res, 'Authentication required. Please login to continue.', 401, null, constants_1.ERROR_CODES.UNAUTHORIZED);
    }
    try {
        const user = await (0, knex_1.default)(constants_1.DB_TABLES.USERS)
            .where({ id: req.user.userId })
            .select('is_email_verified')
            .first();
        if (!user || !user.is_email_verified) {
            return (0, response_utils_1.sendError)(res, 'Your email address is not verified. Please verify your email address to perform this action.', 403, null, constants_1.ERROR_CODES.EMAIL_NOT_VERIFIED);
        }
        req.user.isEmailVerified = true;
        return next();
    }
    catch (error) {
        return next(error);
    }
}
