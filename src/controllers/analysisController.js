const SitemapService = require('../services/sitemapService');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Detect sitemap URL(s) from a website
 * GET /api/detect-sitemap?url=website_url
 */
const detectSitemap = async (req, res) => {
  const { url } = req.query;

  try {
    logger.info(`Detecting sitemaps for: ${url} (user: ${req.user.email})`);

    // Detect sitemaps from website
    const sitemaps = await SitemapService.detectSitemapsFromWebsite(url);

    logger.info(`Found ${sitemaps.length} sitemap(s) for: ${url}`);

    res.json({
      success: true,
      websiteUrl: url,
      sitemaps: sitemaps,
      count: sitemaps.length
    });
  } catch (error) {
    logger.error(`Sitemap detection failed for ${url}:`, error);
    throw new ApiError(500, `Sitemap detection failed: ${error.message}`);
  }
};

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

/**
 * Analyze sitemap with real-time progress updates via SSE
 * GET /api/sitemap-analysis-stream?url=sitemap_url
 */
const analyzeSitemapStream = async (req, res) => {
  const { url } = req.query;

  try {
    logger.info(`Starting SSE sitemap analysis for: ${url} (user: ${req.user.email})`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Progress callback
    const sendProgress = (current, total, currentUrl) => {
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current,
        total,
        currentUrl,
        percentage: Math.round((current / total) * 100)
      })}\n\n`);
    };

    // Perform analysis with progress updates
    const result = await SitemapService.analyzeSitemapWithProgress(url, sendProgress);

    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: result
    })}\n\n`);

    res.end();

    logger.info(`SSE sitemap analysis completed for: ${url} (user: ${req.user.email})`);
  } catch (error) {
    logger.error(`SSE sitemap analysis failed for ${url}:`, error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
};

module.exports = {
  detectSitemap,
  analyzeSitemap,
  analyzeSitemapStream,
  getAnalysisHistory,
  getAnalysisStats,
};
