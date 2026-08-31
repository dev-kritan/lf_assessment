import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { TwoFactorController } from '../controllers/twoFactor.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { twoFactorVerifySchema } from '../dto';
import { ERROR_CODES } from '../constants';

const router = Router();

const twoFactorLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many 2FA attempts. Please try again after 10 minutes.',
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    },
  },
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

router.use(authenticate);

router.post('/setup', TwoFactorController.setup2FA);
router.post('/enable', twoFactorLimiter, validate(twoFactorVerifySchema), TwoFactorController.enable2FA);
router.post('/disable', twoFactorLimiter, validate(twoFactorVerifySchema), TwoFactorController.disable2FA);

export default router;
