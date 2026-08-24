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
    // Graceful shutdown
    const shutdown = async () => {
        logger_1.logger.info('Gracefully shutting down server...');
        server.close(() => {
            logger_1.logger.info('HTTP server closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    });
}
