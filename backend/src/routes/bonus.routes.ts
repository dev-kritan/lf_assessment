import { Router } from 'express';
import { BonusController } from '../controllers/bonus.controller';

const router = Router();

router.get('/data', BonusController.getBonusData);
router.get('/q1', BonusController.executeQ1);
router.get('/q2', BonusController.executeQ2);
router.get('/q4', BonusController.executeQ4);

export default router;
