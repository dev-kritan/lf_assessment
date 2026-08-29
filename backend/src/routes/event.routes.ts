import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { RsvpController } from '../controllers/rsvp.controller';
import { authenticate, optionalAuthenticate, requireVerified } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
  setRsvpSchema,
  bulkDeleteEventsSchema,
} from '../dto';

const router = Router();

// Event Collection & Metrics
router.get('/metrics', EventController.getMetrics);
router.get('/', optionalAuthenticate, validate(queryEventsSchema, 'query'), EventController.getEvents);

// Bulk Event Operations (verified creators only)
router.post('/bulk-delete', authenticate, requireVerified, validate(bulkDeleteEventsSchema), EventController.bulkDeleteEvents);
router.delete('/bulk', authenticate, requireVerified, validate(bulkDeleteEventsSchema), EventController.bulkDeleteEvents);

// Event CRUD (mutations restricted to verified users)
router.get('/:id', optionalAuthenticate, EventController.getEventById);
router.post('/', authenticate, requireVerified, validate(createEventSchema), EventController.createEvent);
router.put('/:id', authenticate, requireVerified, validate(updateEventSchema), EventController.updateEvent);
router.patch('/:id', authenticate, requireVerified, validate(updateEventSchema), EventController.updateEvent);
router.delete('/:id', authenticate, requireVerified, EventController.deleteEvent);

// Canonical Nested REST Subresources for Event RSVPs & Attendees (RSVP responses require verified user)
router.get('/:id/attendees', RsvpController.getAttendees);
router.post('/:id/rsvps', authenticate, requireVerified, validate(setRsvpSchema), RsvpController.setRsvp);
router.post('/:id/rsvp', authenticate, requireVerified, validate(setRsvpSchema), RsvpController.setRsvp);
router.delete('/:id/rsvps', authenticate, requireVerified, RsvpController.deleteRsvp);
router.delete('/:id/rsvp', authenticate, requireVerified, RsvpController.deleteRsvp);

export default router;

