const { query } = require('../../config/database');
const logger = require('../utils/logger');

class Usage {
  /**
   * Get usage data for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object|null>} Usage object or null
   */
  static async getByUserId(userId) {
    const text = 'SELECT * FROM user_usage WHERE user_id = $1';
    const values = [userId];

    try {
      const result = await query(text, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting usage by user_id:', error);
      throw error;
    }
  }

  /**
   * Check if user has remaining quota
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Quota check result
   */
  static async checkQuota(userId) {
    const text = `
      SELECT
        user_id,
        requests_made,
        requests_limit,
        (requests_limit - requests_made) as remaining,
        period_start,
        period_end,
        CASE
          WHEN period_end < NOW() THEN TRUE
          ELSE FALSE
        END as period_expired,
        CASE
          WHEN requests_made >= requests_limit THEN FALSE
          ELSE TRUE
        END as has_quota
      FROM user_usage
      WHERE user_id = $1
    `;
    const values = [userId];

    try {
      const result = await query(text, values);
      if (result.rows.length === 0) {
        return {
          hasQuota: false,
          error: 'Usage record not found',
        };
      }

      const usage = result.rows[0];

      // If period expired, reset quota
      if (usage.period_expired) {
        await this.resetQuota(userId);
        return {
          hasQuota: true,
          remaining: usage.requests_limit,
          limit: usage.requests_limit,
          requestsMade: 0,
          periodReset: true,
        };
      }

      return {
        hasQuota: usage.has_quota,
        remaining: parseInt(usage.remaining, 10),
        limit: usage.requests_limit,
        requestsMade: usage.requests_made,
        periodStart: usage.period_start,
        periodEnd: usage.period_end,
      };
    } catch (error) {
      logger.error('Error checking quota:', error);
      throw error;
    }
  }

  /**
   * Increment usage counter
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Updated usage
   */
  static async incrementUsage(userId) {
    const text = `
      UPDATE user_usage
      SET requests_made = requests_made + 1,
          last_request_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `;
    const values = [userId];

    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error incrementing usage:', error);
      throw error;
    }
  }

  /**
   * Reset quota for a user (called when period expires)
   * @param {string} userId - User UUID
   * @returns {Promise<boolean>} Success status
   */
  static async resetQuota(userId) {
    const text = `
      UPDATE user_usage
      SET requests_made = 0,
          period_start = NOW(),
          period_end = NOW() + INTERVAL '30 days'
      WHERE user_id = $1
      RETURNING user_id
    `;
    const values = [userId];

    try {
      const result = await query(text, values);
      logger.info(`Quota reset for user: ${userId}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error resetting quota:', error);
      throw error;
    }
  }

  /**
   * Reset all expired quotas (run as scheduled job)
   * @returns {Promise<number>} Number of quotas reset
   */
  static async resetExpiredQuotas() {
    const text = 'SELECT reset_expired_quotas()';

    try {
      const result = await query(text);
      const count = result.rows[0].reset_expired_quotas;
      if (count > 0) {
        logger.info(`Reset ${count} expired quotas`);
      }
      return count;
    } catch (error) {
      logger.error('Error resetting expired quotas:', error);
      throw error;
    }
  }

  /**
   * Update usage limit (when plan changes)
   * @param {string} userId - User UUID
   * @param {number} newLimit - New request limit
   * @returns {Promise<boolean>} Success status
   */
  static async updateLimit(userId, newLimit) {
    const text = 'UPDATE user_usage SET requests_limit = $1 WHERE user_id = $2 RETURNING user_id';
    const values = [newLimit, userId];

    try {
      const result = await query(text, values);
      logger.info(`Usage limit updated for user: ${userId} -> ${newLimit}`);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error updating usage limit:', error);
      throw error;
    }
  }

  /**
   * Get users with low quota (< 10% remaining)
   * @returns {Promise<Array>} Array of users with low quota
   */
  static async getUsersWithLowQuota() {
    const text = `
      SELECT
        uu.user_id,
        u.email,
        uu.requests_made,
        uu.requests_limit,
        (uu.requests_limit - uu.requests_made) as remaining,
        ROUND(((uu.requests_limit - uu.requests_made)::NUMERIC / uu.requests_limit::NUMERIC) * 100, 2) as percentage_remaining
      FROM user_usage uu
      JOIN users u ON uu.user_id = u.user_id
      WHERE uu.period_end > NOW()
      AND (uu.requests_limit - uu.requests_made)::NUMERIC / uu.requests_limit::NUMERIC < 0.1
      AND u.status = 'active'
      ORDER BY percentage_remaining ASC
    `;

    try {
      const result = await query(text);
      return result.rows;
    } catch (error) {
      logger.error('Error getting users with low quota:', error);
      throw error;
    }
  }

  /**
   * Get total usage statistics
   * @returns {Promise<Object>} Usage statistics
   */
  static async getGlobalStats() {
    const text = `
      SELECT
        COUNT(*) as total_users,
        SUM(requests_made) as total_requests,
        AVG(requests_made) as avg_requests_per_user,
        MAX(requests_made) as max_requests,
        COUNT(CASE WHEN requests_made >= requests_limit THEN 1 END) as users_at_limit,
        COUNT(CASE WHEN period_end < NOW() THEN 1 END) as expired_periods
      FROM user_usage
    `;

    try {
      const result = await query(text);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting global usage stats:', error);
      throw error;
    }
  }
}

module.exports = Usage;
