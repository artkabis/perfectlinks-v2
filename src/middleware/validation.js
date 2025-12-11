const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validation schemas
 */
const schemas = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must be at most 30 characters long',
        'any.required': 'Username is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'any.required': 'Password is required',
      }),
    plan: Joi.string()
      .valid('free', 'premium', 'pro')
      .optional()
      .default('free'),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  validateAccount: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Validation token is required',
      }),
    userid: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Invalid user ID format',
        'any.required': 'User ID is required',
      }),
  }),

  sitemapAnalysis: Joi.object({
    url: Joi.string()
      .uri()
      .required()
      .messages({
        'string.uri': 'Please provide a valid URL',
        'any.required': 'URL is required',
      }),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required',
      }),
  }),
};

/**
 * Middleware factory for validating request data
 * @param {string} schemaName - Name of the schema to use
 * @param {string} source - Where to validate ('body', 'query', 'params')
 */
const validate = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      logger.error(`Validation schema not found: ${schemaName}`);
      return res.status(500).json({
        success: false,
        error: 'Validation configuration error',
      });
    }

    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.debug(`Validation error for ${schemaName}:`, errors);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors,
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;

    next();
  };
};

/**
 * Custom validation for URL query parameter
 */
const validateUrl = (req, res, next) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: [
        {
          field: 'url',
          message: 'URL parameter is required',
        },
      ],
    });
  }

  try {
    // Try to parse URL
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: [
        {
          field: 'url',
          message: 'Invalid URL format',
        },
      ],
    });
  }

  next();
};

module.exports = {
  validate,
  validateUrl,
  schemas,
};
