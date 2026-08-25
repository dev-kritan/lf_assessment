"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const knex_1 = __importDefault(require("../config/knex"));
const env_1 = require("../config/env");
const constants_1 = require("../constants");
class TwoFactorService {
    static async generateSecret(userId) {
        const user = await (0, knex_1.default)(constants_1.DB_TABLES.USERS).where({ id: userId }).first();
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        const secret = speakeasy_1.default.generateSecret({
            name: `${env_1.config.appName} (${user.email})`,
            issuer: env_1.config.appName,
            length: constants_1.AUTH_CONFIG.TOTP_SECRET_LENGTH,
        });
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(secret.otpauth_url || '');
        // Save temporary secret until verified
        await (0, knex_1.default)(constants_1.DB_TABLES.USERS).where({ id: userId }).update({
            two_factor_secret: secret.base32,
            updated_at: new Date(),
        });
        return {
            secret: secret.base32,
            qrCode: qrCodeDataUrl,
            otpAuthUrl: secret.otpauth_url,
        };
    }
    static async verifyAndEnable(userId, token) {
        const user = await (0, knex_1.default)(constants_1.DB_TABLES.USERS).where({ id: userId }).first();
        if (!user || !user.two_factor_secret) {
            const error = new Error('Two-factor setup has not been initiated.');
            error.statusCode = 400;
            throw error;
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token,
            window: constants_1.AUTH_CONFIG.TOTP_WINDOW,
        });
        if (!verified) {
            const error = new Error('Invalid authentication code. Please try again.');
            error.statusCode = 400;
            error.code = constants_1.ERROR_CODES.INVALID_2FA_CODE;
            throw error;
        }
        await (0, knex_1.default)(constants_1.DB_TABLES.USERS).where({ id: userId }).update({
            two_factor_enabled: true,
            updated_at: new Date(),
        });
        return {
            success: true,
            message: 'Two-Factor Authentication successfully enabled on your account.',
        };
    }
    static async disable(userId, token) {
        const user = await (0, knex_1.default)(constants_1.DB_TABLES.USERS).where({ id: userId }).first();
        if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
            const error = new Error('2FA is not currently enabled on this account.');
            error.statusCode = 400;
            throw error;
        }
        const verified = speakeasy_1.default.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token,
            window: constants_1.AUTH_CONFIG.TOTP_WINDOW,
        });
        if (!verified) {
            const error = new Error('Invalid authentication code. Unable to disable 2FA.');
            error.statusCode = 400;
            throw error;
        }
        await (0, knex_1.default)(constants_1.DB_TABLES.USERS).where({ id: userId }).update({
            two_factor_enabled: false,
            two_factor_secret: null,
            updated_at: new Date(),
        });
        return {
            success: true,
            message: 'Two-Factor Authentication has been disabled.',
        };
    }
}
exports.TwoFactorService = TwoFactorService;
