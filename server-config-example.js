/**
 * EXEMPLE DE CONFIGURATION - server.js
 *
 * Ajouter ce code pour servir le frontend en production
 *
 * IMPORTANT: Placer ce code APRÈS les middlewares mais AVANT les routes API
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');  // ← AJOUTER cette ligne

const logger = require('./src/utils/logger');
const db = require('./config/database');
const routes = require('./src/routes');
const emailService = require('./src/services/emailService');
const { startScheduledJobs } = require('./src/utils/scheduler');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 9090;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting (general)
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all routes
app.use(generalLimiter);

// Trust proxy
app.set('trust proxy', 1);

// ============================================================================
// FRONTEND STATIC FILES - PRODUCTION
// ============================================================================

// ⬇️⬇️⬇️ AJOUTER CE CODE ICI ⬇️⬇️⬇️

if (NODE_ENV === 'production') {
  // Servir les fichiers statiques du dossier frontend/
  app.use('/frontend', express.static(path.join(__dirname, 'frontend'), {
    maxAge: '1y',  // Cache d'1 an pour les assets
    immutable: true
  }));

  logger.info('Serving frontend static files from /frontend');
}

// ⬆️⬆️⬆️ FIN DU CODE À AJOUTER ⬆️⬆️⬆️

// ============================================================================
// ROUTES
// ============================================================================

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Perfect Links API v2.0',
    status: 'running',
    environment: NODE_ENV,
    version: '2.0.0',
    documentation: 'https://github.com/artkabis/perfectlinks-v2',
  });
});

// ============================================================================
// FRONTEND SPA ROUTING - PRODUCTION
// ============================================================================

// ⬇️⬇️⬇️ AJOUTER CE CODE ICI (APRÈS les routes API) ⬇️⬇️⬇️

if (NODE_ENV === 'production') {
  // Servir index.html pour toutes les routes non-API (SPA routing)
  app.get('*', (req, res, next) => {
    // Ne pas intercepter les routes API
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Servir index.html pour toutes les autres routes
    logger.debug(`SPA routing: ${req.path} → index.html`);
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  logger.info('SPA routing enabled for production');
}

// ⬆️⬆️⬆️ FIN DU CODE À AJOUTER ⬆️⬆️⬆️

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await db.testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Check if tables exist
    const tablesExist = await db.checkTablesExist();
    if (!tablesExist) {
      logger.warn('Database tables not found. Please run: npm run db:setup');
    }

    // Initialize email service
    logger.info('Initializing email service...');
    await emailService.initialize();

    // Start scheduled jobs
    logger.info('Starting scheduled jobs...');
    startScheduledJobs();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Perfect Links API v2.0 started successfully`);
      logger.info(`📍 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Server running on port ${PORT}`);
      logger.info(`📊 API endpoints available at http://localhost:${PORT}/api`);
      logger.info(`💚 Health check: http://localhost:${PORT}/api/health`);

      if (NODE_ENV === 'production') {
        logger.info(`🎨 Frontend available at http://localhost:${PORT}/`);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await db.closePool();
          logger.info('Database connections closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
