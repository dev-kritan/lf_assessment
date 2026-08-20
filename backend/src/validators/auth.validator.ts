import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100),
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
  token: z.string().min(6, '2FA token must be 6 digits').max(6),
});

export const emailVerifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});
