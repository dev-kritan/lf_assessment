import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  emailVerifySchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/verify-email', validate(emailVerifySchema), AuthController.verifyEmail);
router.post('/request-verification', authenticate, AuthController.requestEmailVerification);

export default router;
