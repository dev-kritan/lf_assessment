import { Router } from 'express';
import { RsvpController } from '../controllers/rsvp.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { setRsvpSchema, bulkDeleteRsvpsSchema } from '../dto';

const router = Router();

// Bulk RSVP operations
router.post('/bulk-delete', authenticate, validate(bulkDeleteRsvpsSchema), RsvpController.bulkDeleteRsvps);
router.delete('/bulk', authenticate, validate(bulkDeleteRsvpsSchema), RsvpController.bulkDeleteRsvps);

// User RSVPs collection (canonical REST /me and legacy /my-rsvps)
router.get('/me', authenticate, RsvpController.getMyRsvps);
router.get('/my-rsvps', authenticate, RsvpController.getMyRsvps);

// Backwards-compatible aliases for event subresources
router.get('/events/:id/attendees', RsvpController.getAttendees);
router.post('/events/:id', authenticate, validate(setRsvpSchema), RsvpController.setRsvp);
router.delete('/events/:id', authenticate, RsvpController.deleteRsvp);

export default router;

