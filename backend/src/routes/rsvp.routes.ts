import { Router } from 'express';
import { RsvpController } from '../controllers/rsvp.controller';
import { authenticate, requireVerified } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { setRsvpSchema, bulkDeleteRsvpsSchema } from '../dto';

const router = Router();

// Bulk RSVP operations
router.post('/bulk-delete', authenticate, requireVerified, validate(bulkDeleteRsvpsSchema), RsvpController.bulkDeleteRsvps);
router.delete('/bulk', authenticate, requireVerified, validate(bulkDeleteRsvpsSchema), RsvpController.bulkDeleteRsvps);

// User RSVPs collection (canonical REST /me and legacy /my-rsvps)
router.get('/me', authenticate, RsvpController.getMyRsvps);
router.get('/my-rsvps', authenticate, RsvpController.getMyRsvps);

// Backwards-compatible aliases for event subresources (requires verified user)
router.get('/events/:id/attendees', RsvpController.getAttendees);
router.post('/events/:id', authenticate, requireVerified, validate(setRsvpSchema), RsvpController.setRsvp);
router.delete('/events/:id', authenticate, requireVerified, RsvpController.deleteRsvp);

export default router;

