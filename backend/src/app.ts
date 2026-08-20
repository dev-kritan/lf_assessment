import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { setupSwagger } from './config/swagger';
import apiRouter from './routes';

export function createApp(): Express {
  const app = express();

  // Security & standard middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Allows Swagger UI & embedded previews
  }));

  app.use(cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(config.cookieSecret));

  // Request logger (Morgan + Winston)
  if (config.nodeEnv !== 'test') {
    app.use(requestLogger);
  }

  // Swagger Documentation endpoint
  setupSwagger(app);

  // Mount API router
  app.use('/api/v1', apiRouter);

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
  app.use(errorHandler);

  return app;
}

export default createApp();
