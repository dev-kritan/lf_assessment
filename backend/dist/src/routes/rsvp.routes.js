"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rsvp_controller_1 = require("../controllers/rsvp.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const dto_1 = require("../dto");
const router = (0, express_1.Router)();
// Bulk RSVP operations
router.post('/bulk-delete', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.bulkDeleteRsvpsSchema), rsvp_controller_1.RsvpController.bulkDeleteRsvps);
router.delete('/bulk', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.bulkDeleteRsvpsSchema), rsvp_controller_1.RsvpController.bulkDeleteRsvps);
// User RSVPs collection (canonical REST /me and legacy /my-rsvps)
router.get('/me', auth_middleware_1.authenticate, rsvp_controller_1.RsvpController.getMyRsvps);
router.get('/my-rsvps', auth_middleware_1.authenticate, rsvp_controller_1.RsvpController.getMyRsvps);
// Backwards-compatible aliases for event subresources (requires verified user)
router.get('/events/:id/attendees', rsvp_controller_1.RsvpController.getAttendees);
router.post('/events/:id', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, (0, validate_middleware_1.validate)(dto_1.setRsvpSchema), rsvp_controller_1.RsvpController.setRsvp);
router.delete('/events/:id', auth_middleware_1.authenticate, auth_middleware_1.requireVerified, rsvp_controller_1.RsvpController.deleteRsvp);
exports.default = router;
