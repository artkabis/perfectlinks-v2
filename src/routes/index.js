const express = require('express');
const authController = require('../controllers/authController');
const analysisController = require('../controllers/analysisController');
const { authenticate, extractCustomData } = require('../middleware/auth');
const { checkQuota, incrementUsage, addQuotaHeaders } = require('../middleware/quota');
const { validate, validateUrl } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * POST /api/register
 * Register a new user account
 */
router.post(
  '/register',
  validate('register', 'body'),
  asyncHandler(authController.register)
);

/**
 * POST /api/login
 * Login and get access token
 */
router.post(
  '/login',
  validate('login', 'body'),
  asyncHandler(authController.login)
);

/**
 * GET /api/validate-account
 * Validate user account via email link
 */
router.get(
  '/validate-account',
  validate('validateAccount', 'query'),
  asyncHandler(authController.validateAccount)
);

/**
 * POST /api/refresh-token
 * Refresh access token using refresh token
 */
router.post(
  '/refresh-token',
  validate('refreshToken', 'body'),
  asyncHandler(authController.refreshToken)
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

/**
 * POST /api/logout
 * Logout and invalidate session
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

/**
 * GET /api/me
 * Get current user information and statistics
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser)
);

/**
 * POST /api/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticate,
  validate('login', 'body'), // Reuse login schema for validation
  asyncHandler(authController.changePassword)
);


/**
 * GET /api/detect-sitemap
 * Detect sitemap URL(s) from a website by checking robots.txt
 */
router.get(
  '/detect-sitemap',
  authenticate,
  validateUrl,
  asyncHandler(analysisController.detectSitemap)
);
/**
 * GET /api/sitemap-analysis
 * Analyze sitemap and internal links (Main feature)
 */
router.get(
  '/sitemap-analysis',
  authenticate,
  validateUrl, // <--- DÉPLACÉ ICI !
  extractCustomData,
  checkQuota,
  addQuotaHeaders,
  incrementUsage,
  asyncHandler(analysisController.analyzeSitemap)
);

/**
 * GET /api/analysis-history
 * Get user's analysis history
 */
router.get(
  '/analysis-history',
  authenticate,
  asyncHandler(analysisController.getAnalysisHistory)
);

/**
 * GET /api/analysis-stats
 * Get analysis statistics for current user
 */
router.get(
  '/analysis-stats',
  authenticate,
  asyncHandler(analysisController.getAnalysisStats)
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/health
 * API health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api
 * API root endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Perfect Links API v2.0',
    documentation: 'https://github.com/artkabis/perfectlinks-v2',
    endpoints: {
      public: [
        'POST /api/register',
        'POST /api/login',
        'GET /api/validate-account',
        'POST /api/refresh-token',
      ],
      protected: [
        'POST /api/logout',
        'GET /api/me',
        'POST /api/change-password',
        'GET /api/sitemap-analysis',
        'GET /api/analysis-history',
        'GET /api/analysis-stats',
      ],
    },
  });
});

module.exports = router;
