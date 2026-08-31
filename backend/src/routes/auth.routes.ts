import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import twoFactorRoutes from './twoFactor.routes';
import { ERROR_CODES } from '../constants';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  emailVerifySchema,
  resendVerificationSchema,
} from '../dto';

const router = Router();

// Rate limiter for login attempts (10 requests per 15 minutes per IP/email)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : undefined;
    return email ? `login_${email}` : req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts. Please try again after 15 minutes.',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

// Rate limiter for registration (10 requests per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many accounts created from this IP address. Please try again later.',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

// Rate limiter for resend verification (3 requests per hour per email/IP)
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : undefined;
    return email ? `resend_${email}` : req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many verification email requests for this email. Please try again after 1 hour.',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

router.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

// Email Verification routes (Supports GET for direct link clicks and POST for SPA calls)
router.get('/verify-email', AuthController.verifyEmail);
router.post('/verify-email', validate(emailVerifySchema), AuthController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, validate(resendVerificationSchema), AuthController.resendVerification);
router.post('/request-verification', authenticate, AuthController.requestEmailVerification);

// Nested 2FA routes under /auth/2fa
router.use('/2fa', twoFactorRoutes);

export default router;
