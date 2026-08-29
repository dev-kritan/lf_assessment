"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const rsvp_controller_1 = require("../controllers/rsvp.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const dto_1 = require("../dto");
const router = (0, express_1.Router)();
// Event Collection & Metrics
router.get('/metrics', event_controller_1.EventController.getMetrics);
router.get('/', auth_middleware_1.optionalAuthenticate, (0, validate_middleware_1.validate)(dto_1.queryEventsSchema, 'query'), event_controller_1.EventController.getEvents);
// Bulk Event Operations (verified creators only)
router.post('/bulk-delete', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.bulkDeleteEventsSchema), event_controller_1.EventController.bulkDeleteEvents);
router.delete('/bulk', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.bulkDeleteEventsSchema), event_controller_1.EventController.bulkDeleteEvents);
// Event CRUD (mutations restricted to verified users)
router.get('/:id', auth_middleware_1.optionalAuthenticate, event_controller_1.EventController.getEventById);
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.createEventSchema), event_controller_1.EventController.createEvent);
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.updateEventSchema), event_controller_1.EventController.updateEvent);
router.patch('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.updateEventSchema), event_controller_1.EventController.updateEvent);
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, event_controller_1.EventController.deleteEvent);
// Canonical Nested REST Subresources for Event RSVPs & Attendees (RSVP responses require verified user)
router.get('/:id/attendees', rsvp_controller_1.RsvpController.getAttendees);
router.post('/:id/rsvps', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.setRsvpSchema), rsvp_controller_1.RsvpController.setRsvp);
router.post('/:id/rsvp', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.setRsvpSchema), rsvp_controller_1.RsvpController.setRsvp);
router.delete('/:id/rsvps', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, rsvp_controller_1.RsvpController.deleteRsvp);
router.delete('/:id/rsvp', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, rsvp_controller_1.RsvpController.deleteRsvp);
exports.default = router;
