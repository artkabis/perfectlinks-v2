require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
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

// Trust proxy (for correct IP addresses when behind reverse proxy)
app.set('trust proxy', 1);

// ============================================================================
// ROUTES
// ============================================================================

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
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
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

/**
 * Get the base URL for the server based on environment
 * @returns {string} Base URL for the server
 */
function getServerBaseUrl() {
  // Use APP_URL if explicitly set
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // In production, try to extract from CORS_ORIGIN
  if (NODE_ENV === 'production' && process.env.CORS_ORIGIN) {
    const origins = process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
    // Use the first non-wildcard origin
    const productionOrigin = origins.find((origin) => origin !== '*' && origin.startsWith('http'));
    if (productionOrigin) {
      return productionOrigin;
    }
  }

  // Default to localhost
  return `http://localhost:${PORT}`;
}

/**
 * Initialize services and start server
 */
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

    // Start scheduled jobs (quota reset, session cleanup)
    logger.info('Starting scheduled jobs...');
    startScheduledJobs();

    // Get dynamic server URL
    const serverUrl = getServerBaseUrl();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Perfect Links API v2.0 started successfully`);
      logger.info(`📍 Environment: ${NODE_ENV}`);
      logger.info(`🌐 Server running on port ${PORT}`);
      logger.info(`📊 API endpoints available at ${serverUrl}/api`);
      logger.info(`💚 Health check: ${serverUrl}/api/health`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database pool
          await db.closePool();
          logger.info('Database connections closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
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

// Export app for testing
module.exports = app;
