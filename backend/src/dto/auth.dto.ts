import { z } from 'zod';
import { VALIDATION_LIMITS } from '../constants';

export const registerSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(VALIDATION_LIMITS.USER_NAME_MIN, `Name must be at least ${VALIDATION_LIMITS.USER_NAME_MIN} characters`)
    .max(VALIDATION_LIMITS.USER_NAME_MAX, `Name cannot exceed ${VALIDATION_LIMITS.USER_NAME_MAX} characters`),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string({ message: 'Password is required' })
    .min(VALIDATION_LIMITS.PASSWORD_MIN, `Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN} characters`)
    .max(VALIDATION_LIMITS.PASSWORD_MAX, `Password cannot exceed ${VALIDATION_LIMITS.PASSWORD_MAX} characters`),
});

export type RegisterDTO = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required'),
  twoFactorCode: z
    .string()
    .regex(/^\d{6}$/, '2FA code must be exactly 6 digits')
    .optional(),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

export const twoFactorVerifySchema = z.object({
  token: z
    .string({ message: '2FA token is required' })
    .trim()
    .regex(/^\d{6}$/, `2FA token must be exactly ${VALIDATION_LIMITS.TOTP_CODE_LENGTH} digits`),
});

export type TwoFactorVerifyDTO = z.infer<typeof twoFactorVerifySchema>;

export const emailVerifySchema = z.object({
  token: z
    .string({ message: 'Verification token is required' })
    .trim()
    .min(1, 'Verification token is required'),
});

export type EmailVerifyDTO = z.infer<typeof emailVerifySchema>;
