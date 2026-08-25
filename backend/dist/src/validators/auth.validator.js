"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerifySchema = exports.twoFactorVerifySchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(constants_1.VALIDATION_LIMITS.USER_NAME_MIN, `Name must be at least ${constants_1.VALIDATION_LIMITS.USER_NAME_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.USER_NAME_MAX),
    email: zod_1.z.string().email('Please enter a valid email address').toLowerCase(),
    password: zod_1.z
        .string()
        .min(constants_1.VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${constants_1.VALIDATION_LIMITS.PASSWORD_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.PASSWORD_MAX),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address').toLowerCase(),
    password: zod_1.z.string().min(1, 'Password is required'),
    twoFactorCode: zod_1.z.string().optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required').optional(),
});
exports.twoFactorVerifySchema = zod_1.z.object({
    token: zod_1.z
        .string()
        .min(constants_1.VALIDATION_LIMITS.TOTP_CODE_LENGTH, `2FA token must be ${constants_1.VALIDATION_LIMITS.TOTP_CODE_LENGTH} digits`)
        .max(constants_1.VALIDATION_LIMITS.TOTP_CODE_LENGTH),
});
exports.emailVerifySchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Verification token is required'),
});
