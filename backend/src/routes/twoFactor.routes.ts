import { Router } from 'express';
import { TwoFactorController } from '../controllers/twoFactor.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { twoFactorVerifySchema } from '../dto';

const router = Router();

router.use(authenticate);

router.post('/setup', TwoFactorController.setup2FA);
router.post('/enable', validate(twoFactorVerifySchema), TwoFactorController.enable2FA);
router.post('/disable', validate(twoFactorVerifySchema), TwoFactorController.disable2FA);

export default router;
