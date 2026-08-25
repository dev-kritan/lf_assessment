"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const twoFactor_routes_1 = __importDefault(require("./twoFactor.routes"));
const dto_1 = require("../dto");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_middleware_1.validate)(dto_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validate_middleware_1.validate)(dto_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh-token', (0, validate_middleware_1.validate)(dto_1.refreshTokenSchema), auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_controller_1.AuthController.logout);
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.AuthController.getProfile);
router.post('/verify-email', (0, validate_middleware_1.validate)(dto_1.emailVerifySchema), auth_controller_1.AuthController.verifyEmail);
router.post('/request-verification', auth_middleware_1.authenticate, auth_controller_1.AuthController.requestEmailVerification);
// Nested 2FA routes under /auth/2fa
router.use('/2fa', twoFactor_routes_1.default);
exports.default = router;
