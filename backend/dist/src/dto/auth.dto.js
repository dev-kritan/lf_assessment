"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerifySchema = exports.twoFactorVerifySchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string({ message: 'Name is required' })
        .trim()
        .min(constants_1.VALIDATION_LIMITS.USER_NAME_MIN, `Name must be at least ${constants_1.VALIDATION_LIMITS.USER_NAME_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.USER_NAME_MAX, `Name cannot exceed ${constants_1.VALIDATION_LIMITS.USER_NAME_MAX} characters`),
    email: zod_1.z
        .string({ message: 'Email is required' })
        .trim()
        .email('Please enter a valid email address')
        .toLowerCase(),
    password: zod_1.z
        .string({ message: 'Password is required' })
        .min(constants_1.VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${constants_1.VALIDATION_LIMITS.PASSWORD_MIN} characters`)
        .max(constants_1.VALIDATION_LIMITS.PASSWORD_MAX, `Password cannot exceed ${constants_1.VALIDATION_LIMITS.PASSWORD_MAX} characters`),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ message: 'Email is required' })
        .trim()
        .email('Please enter a valid email address')
        .toLowerCase(),
    password: zod_1.z
        .string({ message: 'Password is required' })
        .min(1, 'Password is required'),
    twoFactorCode: zod_1.z
        .string()
        .regex(/^\d{6}$/, '2FA code must be exactly 6 digits')
        .optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required').optional(),
});
exports.twoFactorVerifySchema = zod_1.z.object({
    token: zod_1.z
        .string({ message: '2FA token is required' })
        .trim()
        .regex(/^\d{6}$/, `2FA token must be exactly ${constants_1.VALIDATION_LIMITS.TOTP_CODE_LENGTH} digits`),
});
exports.emailVerifySchema = zod_1.z.object({
    token: zod_1.z
        .string({ message: 'Verification token is required' })
        .trim()
        .min(1, 'Verification token is required'),
});
