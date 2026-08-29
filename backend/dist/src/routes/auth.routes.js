"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const twoFactor_routes_1 = __importDefault(require("./twoFactor.routes"));
const constants_1 = require("../constants");
const dto_1 = require("../dto");
const router = (0, express_1.Router)();
// Rate limiter for resend verification (3 requests per hour per email/IP)
const resendVerificationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyGenerator: (req) => {
        const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : undefined;
        return email ? `resend_${email}` : req.ip || 'unknown';
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many verification email requests for this email. Please try again after 1 hour.',
            code: constants_1.ERROR_CODES.RATE_LIMIT_EXCEEDED,
        },
    },
    skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});
router.post('/register', (0, validate_middleware_1.validate)(dto_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validate_middleware_1.validate)(dto_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh-token', (0, validate_middleware_1.validate)(dto_1.refreshTokenSchema), auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_controller_1.AuthController.logout);
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.AuthController.getProfile);
// Email Verification routes (Supports GET for direct link clicks and POST for SPA calls)
router.get('/verify-email', auth_controller_1.AuthController.verifyEmail);
router.post('/verify-email', (0, validate_middleware_1.validate)(dto_1.emailVerifySchema), auth_controller_1.AuthController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, (0, validate_middleware_1.validate)(dto_1.resendVerificationSchema), auth_controller_1.AuthController.resendVerification);
router.post('/request-verification', auth_middleware_1.authenticate, auth_controller_1.AuthController.requestEmailVerification);
// Nested 2FA routes under /auth/2fa
router.use('/2fa', twoFactor_routes_1.default);
exports.default = router;
