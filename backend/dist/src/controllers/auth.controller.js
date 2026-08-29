"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const response_utils_1 = require("../utils/response.utils");
const cookie_utils_1 = require("../utils/cookie.utils");
const env_1 = require("../config/env");
const dto_1 = require("../dto");
class AuthController {
    static async register(req, res, next) {
        try {
            const validation = (0, dto_1.validateDto)(dto_1.registerSchema, req.body);
            if (!validation.success) {
                return (0, response_utils_1.sendError)(res, validation.message, validation.statusCode, validation.errors, validation.code);
            }
            const result = await auth_service_1.AuthService.register(validation.data);
            return (0, response_utils_1.sendCreated)(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const validation = (0, dto_1.validateDto)(dto_1.loginSchema, req.body);
            if (!validation.success) {
                return (0, response_utils_1.sendError)(res, validation.message, validation.statusCode, validation.errors, validation.code);
            }
            const result = await auth_service_1.AuthService.login(validation.data);
            if (result.accessToken) {
                (0, cookie_utils_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
            }
            return (0, response_utils_1.sendSuccess)(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            if (!refreshToken) {
                return (0, response_utils_1.sendError)(res, 'Refresh token is required.', 401, null, 'REFRESH_TOKEN_REQUIRED');
            }
            const validation = (0, dto_1.validateDto)(dto_1.refreshTokenSchema, { refreshToken });
            if (!validation.success) {
                return (0, response_utils_1.sendError)(res, validation.message, validation.statusCode, validation.errors, validation.code);
            }
            const result = await auth_service_1.AuthService.refreshAccessToken(refreshToken);
            if (result.accessToken) {
                (0, cookie_utils_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
            }
            return (0, response_utils_1.sendSuccess)(res, result, 'Token refreshed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
            const result = await auth_service_1.AuthService.logout(refreshToken);
            (0, cookie_utils_1.clearAuthCookies)(res);
            return (0, response_utils_1.sendSuccess)(res, result, 'Logged out successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await auth_service_1.AuthService.getProfile(userId);
            return (0, response_utils_1.sendSuccess)(res, profile, 'Profile retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Supports both GET (direct link / browser click) and POST (SPA API calls).
     * For browser GET navigation, redirects to the frontend with verification status.
     */
    static async verifyEmail(req, res, next) {
        try {
            const isGet = req.method === 'GET';
            const token = (isGet ? req.query.token : req.body?.token);
            const uidRaw = (isGet ? req.query.uid : req.body?.uid);
            const uid = uidRaw ? parseInt(String(uidRaw), 10) : undefined;
            const validation = (0, dto_1.validateDto)(dto_1.emailVerifySchema, { token, uid });
            if (!validation.success) {
                if (isGet && req.accepts('html') && !req.xhr) {
                    return res.redirect(`${env_1.config.clientUrl}/verify-email?status=error&message=${encodeURIComponent(validation.message)}`);
                }
                return (0, response_utils_1.sendError)(res, validation.message, validation.statusCode, validation.errors, validation.code);
            }
            const result = await auth_service_1.AuthService.verifyEmail(validation.data.token, validation.data.uid);
            if (isGet && req.accepts('html') && !req.xhr) {
                const queryStatus = result.alreadyVerified ? 'already-verified' : 'success';
                return res.redirect(`${env_1.config.clientUrl}/verify-email?status=${queryStatus}&message=${encodeURIComponent(result.message)}`);
            }
            return (0, response_utils_1.sendSuccess)(res, result, result.message);
        }
        catch (error) {
            if (req.method === 'GET' && req.accepts('html') && !req.xhr) {
                const errorMsg = error.message || 'Verification failed.';
                return res.redirect(`${env_1.config.clientUrl}/verify-email?status=error&message=${encodeURIComponent(errorMsg)}`);
            }
            next(error);
        }
    }
    /**
     * Resends verification email with rate limiting.
     */
    static async resendVerification(req, res, next) {
        try {
            const validation = (0, dto_1.validateDto)(dto_1.resendVerificationSchema, req.body);
            if (!validation.success) {
                return (0, response_utils_1.sendError)(res, validation.message, validation.statusCode, validation.errors, validation.code);
            }
            const result = await auth_service_1.AuthService.resendVerification(validation.data.email);
            return (0, response_utils_1.sendSuccess)(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
    static async requestEmailVerification(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await auth_service_1.AuthService.generateEmailVerification(userId);
            return (0, response_utils_1.sendSuccess)(res, result, result.message);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
