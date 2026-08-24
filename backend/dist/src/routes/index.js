"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const twoFactor_routes_1 = __importDefault(require("./twoFactor.routes"));
const tag_routes_1 = __importDefault(require("./tag.routes"));
const event_routes_1 = __importDefault(require("./event.routes"));
const rsvp_routes_1 = __importDefault(require("./rsvp.routes"));
const bonus_routes_1 = __importDefault(require("./bonus.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/2fa', twoFactor_routes_1.default);
router.use('/tags', tag_routes_1.default);
router.use('/events', event_routes_1.default);
router.use('/rsvps', rsvp_routes_1.default);
router.use('/bonus', bonus_routes_1.default);
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'event-planner-api',
    });
});
exports.default = router;
