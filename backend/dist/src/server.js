"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const knex_1 = require("./config/knex");
const logger_1 = require("./utils/logger");
async function startServer() {
    const app = (0, app_1.createApp)();
    logger_1.logger.info(`Starting Event Planning API server in ${env_1.config.nodeEnv} mode...`);
    await (0, knex_1.testDbConnection)();
    const server = app.listen(env_1.config.port, () => {
        logger_1.logger.info(`🚀 Server running on http://localhost:${env_1.config.port}`);
        logger_1.logger.info(`📚 Swagger API Docs available at http://localhost:${env_1.config.port}/api-docs`);
        logger_1.logger.info(`⚡ API endpoints live at http://localhost:${env_1.config.port}/api/v1`);
    });
    // Graceful shutdown helper
    const shutdown = (signal) => {
        logger_1.logger.info(`Received ${signal}. Gracefully shutting down server...`);
        server.close(() => {
            logger_1.logger.info('HTTP server closed cleanly.');
            process.exit(0);
        });
        // Force shutdown after 10s if connections fail to close
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown: connections took too long to close.');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Global uncaught exception and unhandled rejection listeners
    process.on('uncaughtException', (err) => {
        logger_1.logger.error('CRITICAL: Uncaught Exception detected:', {
            message: err.message,
            stack: err.stack,
        });
        shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('CRITICAL: Unhandled Promise Rejection detected:', {
            reason,
        });
    });
}
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    });
}
