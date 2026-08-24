"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorController = void 0;
const twoFactor_service_1 = require("../services/twoFactor.service");
const response_utils_1 = require("../utils/response.utils");
class TwoFactorController {
    static async setup2FA(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await twoFactor_service_1.TwoFactorService.generateSecret(userId);
            return (0, response_utils_1.sendSuccess)(res, result, '2FA setup initialized');
        }
        catch (error) {
            next(error);
        }
    }
    static async enable2FA(req, res, next) {
        try {
            const userId = req.user.userId;
            const { token } = req.body;
            const result = await twoFactor_service_1.TwoFactorService.verifyAndEnable(userId, token);
            return (0, response_utils_1.sendSuccess)(res, result, '2FA enabled successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async disable2FA(req, res, next) {
        try {
            const userId = req.user.userId;
            const { token } = req.body;
            const result = await twoFactor_service_1.TwoFactorService.disable(userId, token);
            return (0, response_utils_1.sendSuccess)(res, result, '2FA disabled successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TwoFactorController = TwoFactorController;
