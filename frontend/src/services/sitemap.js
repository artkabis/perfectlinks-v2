import api from './api';

/**
 * Sitemap analysis service
 */
const sitemapService = {
  /**
   * Analyze a sitemap
   */
  async analyzeSitemap(sitemapUrl) {
    const response = await api.get('/sitemap-analysis', {
      params: { url: sitemapUrl },
      timeout: 120000, // 2 minutes for analysis
    });
    return response.data;
  },

  /**
   * Get analysis history
   */
  async getAnalysisHistory(limit = 50, offset = 0) {
    const response = await api.get('/analysis-history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get analysis statistics
   */
  async getAnalysisStats(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/analysis-stats', { params });
    return response.data;
  },

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return url;
    }
  },

  /**
   * Check if URL is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get robots.txt from domain
   */
  async getRobotsTxt(domain) {
    try {
      const robotsUrl = domain.endsWith('/')
        ? `${domain}robots.txt`
        : `${domain}/robots.txt`;

      const response = await fetch(robotsUrl);

      if (response.ok) {
        const text = await response.text();
        return { success: true, content: text, url: robotsUrl };
      }

      return { success: false, error: 'robots.txt not found', url: robotsUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Extract sitemap URLs from robots.txt
   */
  extractSitemapsFromRobots(robotsContent) {
    const lines = robotsContent.split('\n');
    const sitemaps = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('sitemap:')) {
        const url = trimmed.substring(8).trim();
        if (this.isValidUrl(url)) {
          sitemaps.push(url);
        }
      }
    });

    return sitemaps;
  },
};

export default sitemapService;
