const { query } = require('../../config/database');
const logger = require('../utils/logger');

class UsageLog {
  /**
   * Create a new usage log entry
   * @param {Object} logData - Log data
   * @returns {Promise<Object>} Created log entry
   */
  static async create(logData) {
    const {
      userId,
      endpoint,
      method,
      siteUrl = null,
      statusCode,
      durationMs = null,
      ipAddress = null,
      userAgent = null,
      errorMessage = null,
    } = logData;

    const text = `
      INSERT INTO usage_logs (user_id, endpoint, method, site_url, status_code, duration_ms, ip_address, user_agent, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;

    const values = [
      userId,
      endpoint,
      method,
      siteUrl,
      statusCode,
      durationMs,
      ipAddress,
      userAgent,
      errorMessage,
    ];

    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating usage log:', error);
      // Don't throw - logging should not break the application
      return null;
    }
  }

  /**
   * Get logs for a specific user
   * @param {string} userId - User UUID
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array>} Array of log entries
   */
  static async getByUserId(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const text = `
      SELECT *
      FROM usage_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [userId, limit, offset];

    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting usage logs by user_id:', error);
      throw error;
    }
  }

  /**
   * Get logs for a specific endpoint
   * @param {string} endpoint - Endpoint path
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of log entries
   */
  static async getByEndpoint(endpoint, options = {}) {
    const { limit = 100, offset = 0 } = options;

    const text = `
      SELECT *
      FROM usage_logs
      WHERE endpoint = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const values = [endpoint, limit, offset];

    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting usage logs by endpoint:', error);
      throw error;
    }
  }

  /**
   * Get logs with errors
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of error log entries
   */
  static async getErrors(options = {}) {
    const { limit = 100, offset = 0 } = options;

    const text = `
      SELECT *
      FROM usage_logs
      WHERE status_code >= 400 OR error_message IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const values = [limit, offset];

    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting error logs:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a user
   * @param {string} userId - User UUID
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Usage statistics
   */
  static async getStatsForUser(userId, startDate = null, endDate = null) {
    let text = `
      SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
        AVG(duration_ms) as avg_duration_ms,
        MAX(duration_ms) as max_duration_ms,
        MIN(created_at) as first_request,
        MAX(created_at) as last_request,
        COUNT(DISTINCT site_url) as unique_sites_analyzed
      FROM usage_logs
      WHERE user_id = $1
    `;

    const values = [userId];

    if (startDate && endDate) {
      text += ' AND created_at BETWEEN $2 AND $3';
      values.push(startDate, endDate);
    }

    try {
      const result = await query(text, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting stats for user:', error);
      throw error;
    }
  }

  /**
   * Get global statistics
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Global statistics
   */
  static async getGlobalStats(startDate = null, endDate = null) {
    let text = `
      SELECT
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
        AVG(duration_ms) as avg_duration_ms,
        COUNT(DISTINCT site_url) as unique_sites_analyzed,
        endpoint,
        COUNT(*) as requests_per_endpoint
      FROM usage_logs
    `;

    const values = [];

    if (startDate && endDate) {
      text += ' WHERE created_at BETWEEN $1 AND $2';
      values.push(startDate, endDate);
    }

    text += ' GROUP BY endpoint ORDER BY requests_per_endpoint DESC';

    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting global stats:', error);
      throw error;
    }
  }

  /**
   * Delete old logs (data retention)
   * @param {number} daysToKeep - Number of days to keep logs
   * @returns {Promise<number>} Number of deleted logs
   */
  static async deleteOldLogs(daysToKeep = 90) {
    const text = `
      DELETE FROM usage_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING id
    `;

    try {
      const result = await query(text);
      if (result.rowCount > 0) {
        logger.info(`Deleted ${result.rowCount} old usage logs (older than ${daysToKeep} days)`);
      }
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting old logs:', error);
      throw error;
    }
  }

  /**
   * Get most analyzed sites
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Array of most analyzed sites
   */
  static async getMostAnalyzedSites(limit = 10) {
    const text = `
      SELECT
        site_url,
        COUNT(*) as analysis_count,
        COUNT(DISTINCT user_id) as unique_users,
        MAX(created_at) as last_analyzed
      FROM usage_logs
      WHERE site_url IS NOT NULL
      GROUP BY site_url
      ORDER BY analysis_count DESC
      LIMIT $1
    `;
    const values = [limit];

    try {
      const result = await query(text, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting most analyzed sites:', error);
      throw error;
    }
  }
}

module.exports = UsageLog;
