import { Router } from 'express';
import { RsvpController } from '../controllers/rsvp.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { setRsvpSchema } from '../validators/rsvp.validator';

const router = Router();

router.get('/my-rsvps', authenticate, RsvpController.getMyRsvps);
router.get('/events/:id/attendees', RsvpController.getAttendees);
router.post('/events/:id', authenticate, validate(setRsvpSchema), RsvpController.setRsvp);

export default router;
