const AuthService = require('../services/authService');
const Session = require('../models/Session');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Get token from Authorization header or query parameter (for SSE)
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      // Allow token in query parameter for EventSource (SSE)
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No bearer token provided',
      });
    }

    // Verify token
    const decoded = AuthService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
      });
    }

    // Check if session exists and is active
    const session = await Session.findByAccessToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        message: 'Session not found or expired',
      });
    }

    // Get user from database
    const user = await User.findByUserId(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'User account no longer exists',
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account not active',
        message: `Account status: ${user.status}`,
      });
    }

    // Update session activity
    await Session.updateActivity(session.session_id);

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * Middleware to check if user has specific plan
 * @param {Array<string>} allowedPlans - Array of allowed plan names
 */
const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!allowedPlans.includes(req.user.plan)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient plan',
        message: `This feature requires one of the following plans: ${allowedPlans.join(', ')}`,
        currentPlan: req.user.plan,
      });
    }

    next();
  };
};

/**
 * Middleware to extract and decode custom header data
 * Used for backward compatibility with the old system
 */
const extractCustomData = (req, res, next) => {
  try {
    const customData = req.headers['x-custom-data'];

    if (customData) {
      const decoded = JSON.parse(customData);

      if (decoded.encodedEmail) {
        const email = Buffer.from(decoded.encodedEmail, 'base64').toString('utf-8');
        req.customEmail = email;
      }

      req.customData = decoded;
    }

    next();
  } catch (error) {
    logger.error('Error extracting custom data:', error);
    // Don't fail the request, just continue without custom data
    next();
  }
};

/**
 * Optional authentication middleware
 * Authenticates if token is present, but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    return next();
  }

  // Token provided, try to authenticate
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  requirePlan,
  extractCustomData,
  optionalAuth,
};
