"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerifySchema = exports.twoFactorVerifySchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: zod_1.z.string().email('Please enter a valid email address').toLowerCase(),
    password: zod_1.z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100),
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
    token: zod_1.z.string().min(6, '2FA token must be 6 digits').max(6),
});
exports.emailVerifySchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Verification token is required'),
});
