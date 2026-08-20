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

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Gracefully shutting down server...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
