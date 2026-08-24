import { z } from 'zod';
import { VALIDATION_LIMITS } from '../constants';

export const registerSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_LIMITS.USER_NAME_MIN, `Name must be at least ${VALIDATION_LIMITS.USER_NAME_MIN} characters`)
    .max(VALIDATION_LIMITS.USER_NAME_MAX),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters`)
    .max(VALIDATION_LIMITS.PASSWORD_MAX),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

export const twoFactorVerifySchema = z.object({
  token: z
    .string()
    .min(VALIDATION_LIMITS.TOTP_CODE_LENGTH, `2FA token must be ${VALIDATION_LIMITS.TOTP_CODE_LENGTH} digits`)
    .max(VALIDATION_LIMITS.TOTP_CODE_LENGTH),
});

export const emailVerifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
