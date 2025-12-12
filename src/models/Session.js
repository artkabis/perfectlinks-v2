const { query } = require('../../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class Session {
  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  static async create(sessionData) {
    const { userId, accessToken, refreshToken, ipAddress, userAgent, expiresAt } = sessionData;

    // Generate UUID for the session (required for PostgreSQL 9.6 without pgcrypto)
    const sessionId = crypto.randomUUID();

    const text = `
      INSERT INTO user_sessions (session_id, user_id, access_token, refresh_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING session_id, user_id, created_at, expires_at
    `;

    const values = [sessionId, userId, accessToken, refreshToken, ipAddress, userAgent, expiresAt];

    try {
      const result = await query(text, values);
      logger.info(`Session created for user: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Find session by access token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findByAccessToken(accessToken) {
    const text = `
      SELECT * FROM user_sessions
      WHERE access_token = $1
      AND is_active = TRUE
      AND expires_at > NOW()
    `;
    const values = [accessToken];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding session by access token:', error);
      throw error;
    }
  }

  /**
   * Find session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findByRefreshToken(refreshToken) {
    const text = `
      SELECT * FROM user_sessions
      WHERE refresh_token = $1
      AND is_active = TRUE
    `;
    const values = [refreshToken];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding session by refresh token:', error);
      throw error;
    }
  }

  /**
   * Update session's last activity
   * @param {string} sessionId - Session UUID
   * @returns {Promise<void>}
   */
  static async updateActivity(sessionId) {
    const text = 'UPDATE user_sessions SET last_activity_at = NOW() WHERE session_id = $1';
    const values = [sessionId];

    try {
      await query(text, values);
    } catch (error) {
      logger.error('Error updating session activity:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Update session tokens (for refresh)
   * @param {string} sessionId - Session UUID
   * @param {string} newAccessToken - New access token
   * @param {Date} newExpiresAt - New expiration date
   * @returns {Promise<boolean>} Success status
   */
  static async updateTokens(sessionId, newAccessToken, newExpiresAt) {
    const text = `
      UPDATE user_sessions
      SET access_token = $1, expires_at = $2, last_activity_at = NOW()
      WHERE session_id = $3
      RETURNING session_id
    `;
    const values = [newAccessToken, newExpiresAt, sessionId];

    try {
      const result = await query(text, values);
      logger.info(`Session tokens updated: ${sessionId}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error updating session tokens:', error);
      throw error;
    }
  }

  /**
   * Invalidate a session (logout)
   * @param {string} sessionId - Session UUID
   * @returns {Promise<boolean>} Success status
   */
  static async invalidate(sessionId) {
    const text = 'UPDATE user_sessions SET is_active = FALSE WHERE session_id = $1 RETURNING session_id';
    const values = [sessionId];

    try {
      const result = await query(text, values);
      logger.info(`Session invalidated: ${sessionId}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      throw error;
    }
  }

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User UUID
   * @returns {Promise<number>} Number of sessions invalidated
   */
  static async invalidateAllForUser(userId) {
    const text = 'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE RETURNING session_id';
    const values = [userId];

    try {
      const result = await query(text, values);
      logger.info(`All sessions invalidated for user: ${userId} (count: ${result.rowCount})`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error invalidating all sessions for user:', error);
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Array>} Array of sessions
   */
  static async getActiveSessionsForUser(userId) {
    const text = `
      SELECT session_id, ip_address, user_agent, created_at, last_activity_at, expires_at
      FROM user_sessions
      WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()
      ORDER BY last_activity_at DESC
    `;
    const values = [userId];

    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting active sessions for user:', error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of sessions cleaned
   */
  static async cleanupExpired() {
    const text = 'SELECT cleanup_expired_sessions()';

    try {
      const result = await query(text);
      const count = result.rows[0].cleanup_expired_sessions;
      if (count > 0) {
        logger.info(`Cleaned up ${count} expired sessions`);
      }
      return count;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Delete session permanently
   * @param {string} sessionId - Session UUID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(sessionId) {
    const text = 'DELETE FROM user_sessions WHERE session_id = $1 RETURNING session_id';
    const values = [sessionId];

    try {
      const result = await query(text, values);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }
}

module.exports = Session;
