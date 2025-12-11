const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || 5;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 10000;
const USER_AGENT = process.env.USER_AGENT || 'PerfectLinks Bot/2.0 (+https://perfectlinks.artkabis.fr)';

class SitemapService {
  /**
   * Parse sitemap XML and extract URLs
   * @param {string} sitemapUrl - URL of the sitemap
   * @returns {Promise<Array<string>>} Array of URLs
   */
  static async parseSitemap(sitemapUrl) {
    try {
      logger.info(`Fetching sitemap: ${sitemapUrl}`);

      const response = await axios.get(sitemapUrl, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      const xml = response.data;
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xml);

      let urls = [];

      // Handle regular sitemap (urlset)
      if (result.urlset && result.urlset.url) {
        urls = result.urlset.url.map((item) => item.loc[0]);
      }

      // Handle sitemap index (sitemapindex)
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        const sitemapUrls = result.sitemapindex.sitemap.map((item) => item.loc[0]);

        // Recursively fetch all sitemaps
        const nestedUrls = await Promise.all(
          sitemapUrls.map((url) => this.parseSitemap(url))
        );

        urls = nestedUrls.flat();
      }

      logger.info(`Found ${urls.length} URLs in sitemap`);
      return urls;
    } catch (error) {
      logger.error('Error parsing sitemap:', error.message);
      throw new Error(`Failed to parse sitemap: ${error.message}`);
    }
  }

  /**
   * Fetch and analyze internal links from a page
   * @param {string} pageUrl - URL of the page to analyze
   * @param {string} baseUrl - Base URL for resolving relative links
   * @returns {Promise<Object>} Analysis result
   */
  static async analyzePageLinks(pageUrl, baseUrl) {
    try {
      const response = await axios.get(pageUrl, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT,
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept 4xx errors
      });

      const $ = cheerio.load(response.data);
      const links = [];
      const baseDomain = new URL(baseUrl).hostname;

      // Extract all links
      $('a[href]').each((index, element) => {
        const href = $(element).attr('href');
        const anchor = $(element).text().trim();

        if (!href) return;

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, pageUrl).href;
          const urlObj = new URL(absoluteUrl);

          // Only process internal links (same domain)
          if (urlObj.hostname === baseDomain) {
            // Remove hash and trailing slash for consistency
            const cleanUrl = absoluteUrl.split('#')[0].replace(/\/$/, '');

            links.push({
              url: cleanUrl,
              anchor: anchor || '(no anchor text)',
              status: null, // Will be checked later
              redirectUrl: null,
            });
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      });

      return {
        url: pageUrl,
        statusCode: response.status,
        links,
      };
    } catch (error) {
      logger.error(`Error analyzing page ${pageUrl}:`, error.message);

      return {
        url: pageUrl,
        statusCode: error.response?.status || 0,
        links: [],
        error: error.message,
      };
    }
  }

  /**
   * Check HTTP status of a URL
   * @param {string} url - URL to check
   * @returns {Promise<Object>} Status info
   */
  static async checkUrlStatus(url) {
    try {
      const response = await axios.head(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT,
        },
        maxRedirects: 0, // Don't follow redirects
        validateStatus: () => true, // Accept all status codes
      });

      const result = {
        url,
        status: response.status,
        redirectUrl: null,
      };

      // Check for redirects
      if (response.status >= 300 && response.status < 400) {
        result.redirectUrl = response.headers.location;
      }

      return result;
    } catch (error) {
      return {
        url,
        status: 0,
        error: error.message,
      };
    }
  }

  /**
   * Process URLs in batches to avoid overwhelming the server
   * @param {Array} urls - Array of URLs to process
   * @param {Function} processFn - Function to process each URL
   * @param {number} batchSize - Number of concurrent requests
   * @returns {Promise<Array>} Processing results
   */
  static async processBatch(urls, processFn, batchSize = MAX_CONCURRENT_REQUESTS) {
    const results = [];

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);

      logger.debug(`Processed batch ${i / batchSize + 1}/${Math.ceil(urls.length / batchSize)}`);
    }

    return results;
  }

  /**
   * Perform complete sitemap analysis
   * @param {string} sitemapUrl - URL of the sitemap
   * @returns {Promise<Object>} Complete analysis result
   */
  static async analyzeSitemap(sitemapUrl) {
    try {
      const startTime = Date.now();

      // Step 1: Parse sitemap to get all URLs
      logger.info('Step 1: Parsing sitemap...');
      const allUrls = await this.parseSitemap(sitemapUrl);

      if (allUrls.length === 0) {
        throw new Error('No URLs found in sitemap');
      }

      // Get base URL for internal link detection
      const baseUrl = new URL(allUrls[0]).origin;

      // Step 2: Analyze each page for internal links
      logger.info('Step 2: Analyzing internal links...');
      const pageAnalyses = await this.processBatch(
        allUrls,
        (url) => this.analyzePageLinks(url, baseUrl)
      );

      // Step 3: Extract all internal links found
      const allInternalLinks = new Set();
      const internalLinksData = [];

      pageAnalyses.forEach((page) => {
        const links = page.links || [];

        internalLinksData.push({
          link: page.url,
          statusCode: page.statusCode,
          internalLinks: links,
        });

        links.forEach((link) => {
          allInternalLinks.add(link.url);
        });
      });

      // Step 4: Find orphan links (in sitemap but not linked internally)
      logger.info('Step 3: Identifying orphan links...');
      const linkedUrls = new Set(allInternalLinks);
      const missingLinks = allUrls.filter((url) => {
        // Normalize URL (remove trailing slash)
        const normalized = url.replace(/\/$/, '');
        return !linkedUrls.has(normalized) && !linkedUrls.has(url);
      });

      // Step 5: Check status of all internal links
      logger.info('Step 4: Checking link statuses...');
      const uniqueLinks = Array.from(allInternalLinks);
      const statusChecks = await this.processBatch(
        uniqueLinks,
        (url) => this.checkUrlStatus(url)
      );

      // Create status map for quick lookup
      const statusMap = new Map();
      statusChecks.forEach((check) => {
        statusMap.set(check.url, check);
      });

      // Update link statuses in the result
      internalLinksData.forEach((page) => {
        page.internalLinks.forEach((link) => {
          const statusInfo = statusMap.get(link.url);
          if (statusInfo) {
            link.status = statusInfo.status;
            link.redirectUrl = statusInfo.redirectUrl;
          }
        });
      });

      const duration = Date.now() - startTime;

      logger.info(`Sitemap analysis completed in ${duration}ms`);

      return {
        datas: {
          links: allUrls,
          internalLinks: internalLinksData,
          missingLinks,
        },
        meta: {
          totalUrls: allUrls.length,
          totalInternalLinks: allInternalLinks.size,
          orphanLinks: missingLinks.length,
          duration: `${duration}ms`,
        },
      };
    } catch (error) {
      logger.error('Sitemap analysis failed:', error);
      throw error;
    }
  }
}

module.exports = SitemapService;
