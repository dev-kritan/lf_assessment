import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
} from '../dto';

const router = Router();

router.get('/metrics', EventController.getMetrics);
router.get('/', optionalAuthenticate, validate(queryEventsSchema, 'query'), EventController.getEvents);
router.get('/:id', optionalAuthenticate, EventController.getEventById);

router.post('/', authenticate, validate(createEventSchema), EventController.createEvent);
router.put('/:id', authenticate, validate(updateEventSchema), EventController.updateEvent);
router.patch('/:id', authenticate, validate(updateEventSchema), EventController.updateEvent);
router.delete('/:id', authenticate, EventController.deleteEvent);

export default router;
