"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const requestLogger_middleware_1 = require("./middlewares/requestLogger.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const swagger_1 = require("./config/swagger");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Security & standard middlewares
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Allows Swagger UI & embedded previews
    }));
    app.use((0, cors_1.default)({
        origin: [env_1.config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, cookie_parser_1.default)(env_1.config.cookieSecret));
    // Request logger (Morgan + Winston)
    if (env_1.config.nodeEnv !== 'test') {
        app.use(requestLogger_middleware_1.requestLogger);
    }
    // Swagger Documentation endpoint
    (0, swagger_1.setupSwagger)(app);
    // Mount API router
    app.use('/api/v1', routes_1.default);
    // 404 Handler for undefined routes
    app.use('*', (req, res) => {
        res.status(404).json({
            success: false,
            error: {
                message: `Endpoint ${req.method} ${req.originalUrl} not found. Refer to /api-docs for documentation.`,
                code: 'ROUTE_NOT_FOUND',
            },
        });
    });
    // Centralized Error Handler
    app.use(error_middleware_1.errorHandler);
    return app;
}
exports.default = createApp();
