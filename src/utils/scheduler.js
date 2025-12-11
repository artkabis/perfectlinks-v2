const Usage = require('../models/Usage');
const Session = require('../models/Session');
const logger = require('./logger');

/**
 * Scheduled job to reset expired quotas
 */
async function resetExpiredQuotas() {
  try {
    logger.info('Running scheduled job: reset expired quotas');
    const count = await Usage.resetExpiredQuotas();
    if (count > 0) {
      logger.info(`Reset ${count} expired quotas`);
    }
  } catch (error) {
    logger.error('Error resetting expired quotas:', error);
  }
}

/**
 * Scheduled job to clean up expired sessions
 */
async function cleanupExpiredSessions() {
  try {
    logger.info('Running scheduled job: cleanup expired sessions');
    const count = await Session.cleanupExpired();
    if (count > 0) {
      logger.info(`Cleaned up ${count} expired sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
  }
}

/**
 * Start all scheduled jobs
 */
function startScheduledJobs() {
  logger.info('Starting scheduled jobs...');

  // Reset expired quotas every hour
  setInterval(resetExpiredQuotas, 60 * 60 * 1000); // 1 hour

  // Cleanup expired sessions every 30 minutes
  setInterval(cleanupExpiredSessions, 30 * 60 * 1000); // 30 minutes

  // Run immediately on startup
  resetExpiredQuotas();
  cleanupExpiredSessions();

  logger.info('Scheduled jobs started successfully');
}

module.exports = {
  startScheduledJobs,
  resetExpiredQuotas,
  cleanupExpiredSessions,
};
