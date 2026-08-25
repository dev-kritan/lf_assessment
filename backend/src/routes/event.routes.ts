import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { RsvpController } from '../controllers/rsvp.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
  setRsvpSchema,
} from '../dto';

const router = Router();

// Event Collection & Metrics
router.get('/metrics', EventController.getMetrics);
router.get('/', optionalAuthenticate, validate(queryEventsSchema, 'query'), EventController.getEvents);

// Event CRUD
router.get('/:id', optionalAuthenticate, EventController.getEventById);
router.post('/', authenticate, validate(createEventSchema), EventController.createEvent);
router.put('/:id', authenticate, validate(updateEventSchema), EventController.updateEvent);
router.patch('/:id', authenticate, validate(updateEventSchema), EventController.updateEvent);
router.delete('/:id', authenticate, EventController.deleteEvent);

// Canonical Nested REST Subresources for Event RSVPs & Attendees
router.get('/:id/attendees', RsvpController.getAttendees);
router.post('/:id/rsvps', authenticate, validate(setRsvpSchema), RsvpController.setRsvp);
router.post('/:id/rsvp', authenticate, validate(setRsvpSchema), RsvpController.setRsvp);

export default router;
