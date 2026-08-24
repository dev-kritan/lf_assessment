"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const response_utils_1 = require("../utils/response.utils");
const cookie_utils_1 = require("../utils/cookie.utils");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            if (result.accessToken) {
                (0, cookie_utils_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
            }
            return (0, response_utils_1.sendCreated)(res, result, 'User registered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
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
    static async verifyEmail(req, res, next) {
        try {
            const { token } = req.body;
            const result = await auth_service_1.AuthService.verifyEmail(token);
            return (0, response_utils_1.sendSuccess)(res, result, 'Email verified successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async requestEmailVerification(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await auth_service_1.AuthService.generateEmailVerification(userId);
            return (0, response_utils_1.sendSuccess)(res, result, 'Verification token generated');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
