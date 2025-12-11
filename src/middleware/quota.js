const Usage = require('../models/Usage');
const UsageLog = require('../models/UsageLog');
const logger = require('../utils/logger');

/**
 * Middleware to check if user has remaining quota
 */
const checkQuota = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Check quota
    const quotaCheck = await Usage.checkQuota(req.user.user_id);

    if (quotaCheck.error) {
      logger.error(`Quota check error for user ${req.user.email}:`, quotaCheck.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check quota',
        message: quotaCheck.error,
      });
    }

    if (!quotaCheck.hasQuota) {
      logger.info(`Quota exceeded for user: ${req.user.email}`);
      return res.status(429).json({
        success: false,
        error: 'Quota exceeded',
        message: 'You have reached your monthly request limit',
        quota: {
          used: quotaCheck.requestsMade || quotaCheck.limit,
          limit: quotaCheck.limit,
          remaining: 0,
          periodEnd: quotaCheck.periodEnd,
        },
      });
    }

    // Attach quota info to request
    req.quota = quotaCheck;

    next();
  } catch (error) {
    logger.error('Quota check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Quota check failed',
      message: 'An error occurred while checking your quota',
    });
  }
};

/**
 * Middleware to increment usage counter after successful request
 * Should be called AFTER the route handler completes successfully
 */
const incrementUsage = async (req, res, next) => {
  // Store the original send function
  const originalSend = res.send;
  const startTime = Date.now();

  // Override send to capture response
  res.send = function (data) {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Only increment if user is authenticated and response is successful
    if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      // Increment usage counter (don't await to not block response)
      Usage.incrementUsage(req.user.user_id)
        .then(() => {
          logger.debug(`Usage incremented for user: ${req.user.email}`);
        })
        .catch((error) => {
          logger.error('Failed to increment usage:', error);
        });

      // Log the request
      UsageLog.create({
        userId: req.user.user_id,
        endpoint: req.path,
        method: req.method,
        siteUrl: req.query.url || req.body.url || null,
        statusCode: res.statusCode,
        durationMs: duration,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch((error) => {
        logger.error('Failed to create usage log:', error);
      });
    }

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log API requests (even if they fail)
 */
const logRequest = (req, res, next) => {
  const startTime = Date.now();

  // Store original send
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;

    // Log the request if user is authenticated
    if (req.user) {
      let errorMessage = null;

      // Try to extract error message from response
      if (res.statusCode >= 400) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          errorMessage = parsed.error || parsed.message || null;
        } catch (e) {
          // Ignore parse errors
        }
      }

      UsageLog.create({
        userId: req.user.user_id,
        endpoint: req.path,
        method: req.method,
        siteUrl: req.query.url || req.body.url || null,
        statusCode: res.statusCode,
        durationMs: duration,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        errorMessage,
      }).catch((error) => {
        logger.error('Failed to create usage log:', error);
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to return quota info in response headers
 */
const addQuotaHeaders = (req, res, next) => {
  if (req.quota) {
    res.setHeader('X-RateLimit-Limit', req.quota.limit);
    res.setHeader('X-RateLimit-Remaining', req.quota.remaining);
    res.setHeader('X-RateLimit-Used', req.quota.requestsMade || 0);

    if (req.quota.periodEnd) {
      res.setHeader('X-RateLimit-Reset', new Date(req.quota.periodEnd).getTime());
    }
  }

  next();
};

module.exports = {
  checkQuota,
  incrementUsage,
  logRequest,
  addQuotaHeaders,
};
