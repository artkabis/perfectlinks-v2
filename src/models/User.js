const { query, transaction } = require('../../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const { username, email, passwordHash, plan = 'free', validationToken } = userData;

    // Generate UUID for the user (required for PostgreSQL 9.6 without pgcrypto)
    const userId = crypto.randomUUID();

    const text = `
      INSERT INTO users (user_id, username, email, password_hash, plan, validation_token, validation_token_expires)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours')
      RETURNING user_id, username, email, plan, status, created_at
    `;

    const values = [userId, username.toLowerCase(), email.toLowerCase(), passwordHash, plan, validationToken];

    try {
      const result = await query(text, values);
      logger.info(`User created: ${email}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const text = 'SELECT * FROM users WHERE email = $1';
    const values = [email.toLowerCase()];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by user_id (UUID)
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUserId(userId) {
    const text = 'SELECT * FROM users WHERE user_id = $1';
    const values = [userId];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by user_id:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    const text = 'SELECT * FROM users WHERE username = $1';
    const values = [username.toLowerCase()];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by validation token
   * @param {string} token - Validation token
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByValidationToken(token) {
    const text = `
      SELECT * FROM users
      WHERE validation_token = $1
      AND validation_token_expires > NOW()
    `;
    const values = [token];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by validation token:', error);
      throw error;
    }
  }

  /**
   * Validate user account
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} Success status
   */
  static async validateAccount(userId) {
    const text = `
      UPDATE users
      SET email_validated = TRUE,
          status = 'active',
          validation_token = NULL,
          validation_token_expires = NULL
      WHERE user_id = $1
      RETURNING user_id
    `;
    const values = [userId];

    try {
      const result = await query(text, values);
      logger.info(`User account validated: ${userId}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error validating user account:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param {string} userId - User UUID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(userId) {
    const text = 'UPDATE users SET last_login_at = NOW() WHERE user_id = $1';
    const values = [userId];

    try {
      await query(text, values);
    } catch (error) {
      logger.error('Error updating last login:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Update user plan
   * @param {string} userId - User UUID
   * @param {string} plan - New plan (free, premium, pro)
   * @returns {Promise<boolean>} Success status
   */
  static async updatePlan(userId, plan) {
    const text = 'UPDATE users SET plan = $1 WHERE user_id = $2 RETURNING user_id';
    const values = [plan, userId];

    try {
      const result = await query(text, values);
      logger.info(`User plan updated: ${userId} -> ${plan}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error updating user plan:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {string} userId - User UUID
   * @param {string} passwordHash - New password hash
   * @returns {Promise<boolean>} Success status
   */
  static async updatePassword(userId, passwordHash) {
    const text = 'UPDATE users SET password_hash = $1 WHERE user_id = $2 RETURNING user_id';
    const values = [passwordHash, userId];

    try {
      const result = await query(text, values);
      logger.info(`User password updated: ${userId}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting status to 'deleted')
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} Success status
   */
  static async softDelete(userId) {
    const text = "UPDATE users SET status = 'deleted' WHERE user_id = $1 RETURNING user_id";
    const values = [userId];

    try {
      const result = await query(text, values);
      logger.info(`User soft deleted: ${userId}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error soft deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User statistics
   */
  static async getStatistics(userId) {
    const text = `
      SELECT
        u.user_id,
        u.username,
        u.email,
        u.plan,
        u.created_at,
        uu.requests_made,
        uu.requests_limit,
        uu.period_start,
        uu.period_end,
        COUNT(ul.id) as total_requests,
        MAX(ul.created_at) as last_request
      FROM users u
      LEFT JOIN user_usage uu ON u.user_id = uu.user_id
      LEFT JOIN usage_logs ul ON u.user_id = ul.user_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, u.username, u.email, u.plan, u.created_at,
               uu.requests_made, uu.requests_limit, uu.period_start, uu.period_end
    `;
    const values = [userId];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if exists
   */
  static async emailExists(email) {
    const text = 'SELECT 1 FROM users WHERE email = $1';
    const values = [email.toLowerCase()];

    try {
      const result = await query(text, values);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if exists
   */
  static async usernameExists(username) {
    const text = 'SELECT 1 FROM users WHERE username = $1';
    const values = [username.toLowerCase()];

    try {
      const result = await query(text, values);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error checking username existence:', error);
      throw error;
    }
  }
}

module.exports = User;
