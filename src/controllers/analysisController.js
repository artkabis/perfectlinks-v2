const SitemapService = require('../services/sitemapService');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Analyze sitemap and internal links
 * GET /api/sitemap-analysis?url=sitemap_url
 */
const analyzeSitemap = async (req, res) => {
  const { url } = req.query;

  try {
    logger.info(`Starting sitemap analysis for: ${url} (user: ${req.user.email})`);

    // Perform analysis
    const result = await SitemapService.analyzeSitemap(url);

    logger.info(`Sitemap analysis completed for: ${url} (user: ${req.user.email})`);

    // Return result in array format (for backward compatibility)
    res.json([result]);
  } catch (error) {
    logger.error(`Sitemap analysis failed for ${url}:`, error);
    throw new ApiError(500, `Analysis failed: ${error.message}`);
  }
};

/**
 * Get user's analysis history
 * GET /api/analysis-history
 */
const getAnalysisHistory = async (req, res) => {
  const UsageLog = require('../models/UsageLog');

  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await UsageLog.getByUserId(req.user.user_id, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    // Filter only sitemap analysis requests
    const analysisLogs = logs.filter((log) => log.endpoint.includes('sitemap-analysis'));

    res.json({
      success: true,
      count: analysisLogs.length,
      data: analysisLogs.map((log) => ({
        id: log.id,
        siteUrl: log.site_url,
        statusCode: log.status_code,
        duration: log.duration_ms,
        timestamp: log.created_at,
        error: log.error_message,
      })),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get analysis statistics for current user
 * GET /api/analysis-stats
 */
const getAnalysisStats = async (req, res) => {
  const UsageLog = require('../models/UsageLog');

  try {
    const { startDate, endDate } = req.query;

    const stats = await UsageLog.getStatsForUser(
      req.user.user_id,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      stats: {
        totalRequests: parseInt(stats.total_requests, 10),
        successfulRequests: parseInt(stats.successful_requests, 10),
        failedRequests: parseInt(stats.failed_requests, 10),
        averageDuration: Math.round(parseFloat(stats.avg_duration_ms)),
        maxDuration: parseInt(stats.max_duration_ms, 10),
        firstRequest: stats.first_request,
        lastRequest: stats.last_request,
        uniqueSitesAnalyzed: parseInt(stats.unique_sites_analyzed, 10),
      },
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  analyzeSitemap,
  getAnalysisHistory,
  getAnalysisStats,
};
