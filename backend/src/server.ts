import { createApp } from './app';
import { config } from './config/env';
import { testDbConnection } from './config/knex';
import { logger } from './utils/logger';

async function startServer() {
  const app = createApp();

  logger.info(`Starting Event Planning API server in ${config.nodeEnv} mode...`);

  await testDbConnection();

  const server = app.listen(config.port, () => {
    logger.info(`🚀 Server running on http://localhost:${config.port}`);
    logger.info(`📚 Swagger API Docs available at http://localhost:${config.port}/api-docs`);
    logger.info(`⚡ API endpoints live at http://localhost:${config.port}/api/v1`);
  });

  // Graceful shutdown helper
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down server...`);
    server.close(() => {
      logger.info('HTTP server closed cleanly.');
      process.exit(0);
    });

    // Force shutdown after 10s if connections fail to close
    setTimeout(() => {
      logger.error('Forced shutdown: connections took too long to close.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Global uncaught exception and unhandled rejection listeners
  process.on('uncaughtException', (err: Error) => {
    logger.error('CRITICAL: Uncaught Exception detected:', {
      message: err.message,
      stack: err.stack,
    });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('CRITICAL: Unhandled Promise Rejection detected:', {
      reason,
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
