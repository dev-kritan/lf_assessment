"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rsvp_controller_1 = require("../controllers/rsvp.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const dto_1 = require("../dto");
const router = (0, express_1.Router)();
// User RSVPs collection (canonical REST /me and legacy /my-rsvps)
router.get('/me', auth_middleware_1.authenticate, rsvp_controller_1.RsvpController.getMyRsvps);
router.get('/my-rsvps', auth_middleware_1.authenticate, rsvp_controller_1.RsvpController.getMyRsvps);
// Backwards-compatible aliases for event subresources
router.get('/events/:id/attendees', rsvp_controller_1.RsvpController.getAttendees);
router.post('/events/:id', auth_middleware_1.authenticate, (0, validate_middleware_1.validate)(dto_1.setRsvpSchema), rsvp_controller_1.RsvpController.setRsvp);
exports.default = router;
