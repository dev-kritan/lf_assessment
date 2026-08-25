import { Router } from 'express';
import { RsvpController } from '../controllers/rsvp.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { setRsvpSchema } from '../dto';

const router = Router();

// User RSVPs collection (canonical REST /me and legacy /my-rsvps)
router.get('/me', authenticate, RsvpController.getMyRsvps);
router.get('/my-rsvps', authenticate, RsvpController.getMyRsvps);

// Backwards-compatible aliases for event subresources
router.get('/events/:id/attendees', RsvpController.getAttendees);
router.post('/events/:id', authenticate, validate(setRsvpSchema), RsvpController.setRsvp);

export default router;
