const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_change_this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

class AuthService {
  /**
   * Hash a password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      return hash;
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  static async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error comparing password:', error);
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Generate JWT access token
   * @param {Object} payload - Token payload (user data)
   * @returns {string} JWT token
   */
  static generateAccessToken(payload) {
    try {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'perfectlinks-api',
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate JWT refresh token
   * @param {Object} payload - Token payload (user data)
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'perfectlinks-api',
      });
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Verify JWT access token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid access token');
      } else {
        logger.error('Error verifying access token:', error);
      }
      return null;
    }
  }

  /**
   * Verify JWT refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object|null} Decoded token payload or null
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid refresh token');
      } else {
        logger.error('Error verifying refresh token:', error);
      }
      return null;
    }
  }

  /**
   * Generate email validation token
   * @returns {string} Random validation token
   */
  static generateValidationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate token expiration date
   * @param {string} expiresIn - Expiration string (e.g., '1h', '7d')
   * @returns {Date} Expiration date
   */
  static calculateExpirationDate(expiresIn = JWT_EXPIRES_IN) {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      default:
        throw new Error('Invalid expiration unit');
    }

    return now;
  }

  /**
   * Create a complete authentication session
   * @param {Object} user - User object
   * @param {Object} requestData - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} Session tokens and user data
   */
  static async createAuthSession(user, requestData = {}) {
    try {
      const { ipAddress = null, userAgent = null } = requestData;

      // Create token payload
      const payload = {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      };

      // Generate tokens
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // Calculate expiration
      const expiresAt = this.calculateExpirationDate(JWT_EXPIRES_IN);

      // Create session in database
      const session = await Session.create({
        userId: user.user_id,
        accessToken,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      });

      // Update user's last login
      await User.updateLastLogin(user.user_id);

      logger.info(`Auth session created for user: ${user.email}`);

      return {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
        tokenType: 'Bearer',
        user: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          plan: user.plan,
          status: user.status,
        },
        session: {
          sessionId: session.session_id,
          createdAt: session.created_at,
        },
      };
    } catch (error) {
      logger.error('Error creating auth session:', error);
      throw new Error('Failed to create authentication session');
    }
  }

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<Object>} New access token
   */
  static async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('Invalid or expired refresh token');
      }

      // Find session with this refresh token
      const session = await Session.findByRefreshToken(refreshToken);
      if (!session) {
        throw new Error('Session not found');
      }

      // Get user data
      const user = await User.findByUserId(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const payload = {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        plan: user.plan,
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newExpiresAt = this.calculateExpirationDate(JWT_EXPIRES_IN);

      // Update session
      await Session.updateTokens(session.session_id, newAccessToken, newExpiresAt);

      logger.info(`Access token refreshed for user: ${user.email}`);

      return {
        accessToken: newAccessToken,
        expiresIn: JWT_EXPIRES_IN,
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Logout user by invalidating session
   * @param {string} accessToken - Current access token
   * @returns {Promise<boolean>} Success status
   */
  static async logout(accessToken) {
    try {
      const session = await Session.findByAccessToken(accessToken);
      if (session) {
        await Session.invalidate(session.session_id);
        logger.info(`User logged out: ${session.user_id}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Validate user credentials
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object if valid, null otherwise
   */
  static async validateCredentials(email, password) {
    try {
      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        logger.debug(`Login attempt failed: user not found - ${email}`);
        return null;
      }

      // Check password
      const isValid = await this.comparePassword(password, user.password_hash);
      if (!isValid) {
        logger.debug(`Login attempt failed: invalid password - ${email}`);
        return null;
      }

      // Check if account is active
      if (user.status !== 'active') {
        logger.debug(`Login attempt failed: account not active - ${email} (status: ${user.status})`);
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error validating credentials:', error);
      throw error;
    }
  }

  /**
   * Clean up old/expired sessions
   * @returns {Promise<number>} Number of sessions cleaned
   */
  static async cleanupSessions() {
    try {
      return await Session.cleanupExpired();
    } catch (error) {
      logger.error('Error cleaning up sessions:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
