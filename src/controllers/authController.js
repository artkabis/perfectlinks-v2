const User = require('../models/User');
const AuthService = require('../services/authService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Register a new user
 * POST /api/register
 */
const register = async (req, res) => {
  const { username, email, password, plan = 'free' } = req.body;

  try {
    // Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      throw new ApiError(409, 'Email already registered');
    }

    // Check if username already exists
    const usernameExists = await User.usernameExists(username);
    if (usernameExists) {
      throw new ApiError(409, 'Username already taken');
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Generate validation token
    const validationToken = AuthService.generateValidationToken();

    // Create user
    const user = await User.create({
      username,
      email,
      passwordHash,
      plan,
      validationToken,
    });

    // Send validation email
    await emailService.sendValidationEmail(user, validationToken);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to validate your account.',
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        status: user.status,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Login user
 * POST /api/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate credentials
    const user = await AuthService.validateCredentials(email, password);

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if email is validated
    if (!user.email_validated) {
      throw new ApiError(403, 'Please validate your email before logging in');
    }

    // Create auth session
    const sessionData = await AuthService.createAuthSession(user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      ...sessionData,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Validate user account via email link
 * GET /api/validate-account?token=xxx&userid=xxx
 */
const validateAccount = async (req, res) => {
  const { token, userid } = req.query;

  try {
    // Find user by validation token
    const user = await User.findByValidationToken(token);

    if (!user) {
      throw new ApiError(400, 'Invalid or expired validation token');
    }

    // Check if userid matches
    if (user.user_id !== userid) {
      throw new ApiError(400, 'Invalid validation request');
    }

    // Validate account
    await User.validateAccount(user.user_id);

    // Send welcome email
    await emailService.sendWelcomeEmail(user);

    logger.info(`Account validated: ${user.email}`);

    res.json({
      success: true,
      message: 'Account validated successfully. You can now log in.',
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh access token
 * POST /api/refresh-token
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      ...result,
    });
  } catch (error) {
    throw new ApiError(401, error.message || 'Failed to refresh token');
  }
};

/**
 * Logout user
 * POST /api/logout
 */
const logout = async (req, res) => {
  try {
    // Token is attached by auth middleware
    if (req.token) {
      await AuthService.logout(req.token);
    }

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get current user info
 * GET /api/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.getStatistics(req.user.user_id);

    res.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        status: req.user.status,
        createdAt: user.created_at,
        usage: {
          requestsMade: user.requests_made || 0,
          requestsLimit: user.requests_limit || 100,
          remaining: (user.requests_limit || 100) - (user.requests_made || 0),
          periodStart: user.period_start,
          periodEnd: user.period_end,
        },
        stats: {
          totalRequests: parseInt(user.total_requests, 10) || 0,
          lastRequest: user.last_request,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Change user password (requires authentication)
 * POST /api/change-password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Verify current password
    const isValid = await AuthService.comparePassword(currentPassword, req.user.password_hash);

    if (!isValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await AuthService.hashPassword(newPassword);

    // Update password
    await User.updatePassword(req.user.user_id, newPasswordHash);

    // Invalidate all sessions for security
    await Session.invalidateAllForUser(req.user.user_id);

    logger.info(`Password changed for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  register,
  login,
  validateAccount,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
};
