"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
const token_utils_1 = require("../utils/token.utils");
const response_utils_1 = require("../utils/response.utils");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    else if (req.signedCookies && req.signedCookies.accessToken) {
        token = req.signedCookies.accessToken;
    }
    if (!token) {
        return (0, response_utils_1.sendError)(res, 'Authentication required. Please login to continue.', 401, null, 'UNAUTHORIZED');
    }
    try {
        const payload = (0, token_utils_1.verifyAccessToken)(token);
        req.user = payload;
        return next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return (0, response_utils_1.sendError)(res, 'Session expired. Please refresh your token or login again.', 401, null, 'TOKEN_EXPIRED');
        }
        return (0, response_utils_1.sendError)(res, 'Invalid authentication token.', 401, null, 'INVALID_TOKEN');
    }
}
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    else if (req.signedCookies && req.signedCookies.accessToken) {
        token = req.signedCookies.accessToken;
    }
    if (token) {
        try {
            const payload = (0, token_utils_1.verifyAccessToken)(token);
            req.user = payload;
        }
        catch {
            // Ignore token validation failure in optional auth mode
        }
    }
    return next();
}
