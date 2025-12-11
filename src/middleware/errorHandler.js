const logger = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle 404 - Route not found
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errors } = err;

  // Default to 500 if no status code
  statusCode = statusCode || 500;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.email || 'anonymous',
    });
  } else {
    logger.warn('Client error:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
      user: req.user?.email || 'anonymous',
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Resource already exists';
        if (err.constraint) {
          if (err.constraint.includes('email')) {
            message = 'Email already registered';
          } else if (err.constraint.includes('username')) {
            message = 'Username already taken';
          }
        }
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
        break;
      case '22P02': // Invalid input syntax
        statusCode = 400;
        message = 'Invalid input format';
        break;
      default:
        // Generic database error
        if (statusCode < 500) statusCode = 500;
        message = 'Database error';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Build error response
  const response = {
    success: false,
    error: message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(response);
};

/**
 * Async error wrapper for route handlers
 * Catches errors from async functions and passes them to error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrapper for try-catch blocks
 */
const tryCatch = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  ApiError,
  notFound,
  errorHandler,
  asyncHandler,
  tryCatch,
};
