import { Router } from 'express';
import authRoutes from './auth.routes';
import twoFactorRoutes from './twoFactor.routes';
import tagRoutes from './tag.routes';
import eventRoutes from './event.routes';
import rsvpRoutes from './rsvp.routes';
import bonusRoutes from './bonus.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/tags', tagRoutes);
router.use('/events', eventRoutes);
router.use('/rsvps', rsvpRoutes);
router.use('/bonus', bonusRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'event-planner-api',
  });
});

export default router;
