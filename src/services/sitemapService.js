const axios = require('axios');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || 5;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 10000;
const USER_AGENT = process.env.USER_AGENT || 'PerfectLinks Bot/2.0 (+https://perfectlinks.artkabis.fr)';

// Content selectors for main content areas (excluding header/footer)
const CONTENT_SELECTORS = [
  '#main-content',
  '#dm_content',
  '#Content',
  '.entry-layout',
  'main',
  '#main',
  '.main-page',
  '.l-submain',
  '.main-wrapper',
  'article',
  '.content',
  '.post-content',
  '.entry-content',
  '[role="main"]',
].join(', ');

// Media file extensions to exclude from link analysis
const MEDIA_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico', '.tiff',
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
  '.mp3', '.wav', '.ogg', '.m4a', '.flac',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.tar', '.gz', '.7z',
  '.exe', '.dmg', '.apk', '.css', '.js'
];

class SitemapService {
  /**
   * Check if URL points to a media file
   * @param {string} url - URL to check
   * @returns {boolean} True if URL is a media file
   */
  static isMediaFile(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return MEDIA_EXTENSIONS.some(ext => pathname.endsWith(ext));
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if link is in main content area (not header/footer/nav)
   * @param {CheerioAPI} $ - Cheerio instance
   * @param {Element} element - Link element to check
   * @returns {boolean} True if link is in main content
   */
  static isInMainContent($, element) {
    const $element = $(element);

    // Exclude header/footer/nav areas
    if ($element.closest('header, footer, nav, .header, .footer, .nav, .navigation, .menu, .sidebar, .widget, [role="navigation"], [role="banner"], [role="contentinfo"]').length > 0) {
      return false;
    }

    // Check if in main content using CONTENT_SELECTORS
    const isInMain = $element.closest(CONTENT_SELECTORS).length > 0;

    return isInMain;
  }

  /**
   * Check if link is a valid content link (not anchor, mailto, tel, etc.)
   * @param {string} href - Link href attribute
   * @returns {boolean} True if link is valid
   */
  static isValidLink(href) {
    if (!href) return false;

    // Exclude anchors, mailto, tel, javascript, etc.
    if (href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        href.startsWith('data:')) {
      return false;
    }

    return true;
  }

  /**
   * Check if link is a CTA button (call to action)
   * @param {CheerioAPI} $ - Cheerio instance
   * @param {Element} element - Link element to check
   * @returns {boolean} True if link is a CTA button
   */
  static isCtaButton($, element) {
    const $element = $(element);
    const classList = $element.attr('class') || '';

    // Common CTA button classes
    const ctaPatterns = /btn|button|cta|call-to-action|download|subscribe|buy|purchase/i;

    return ctaPatterns.test(classList);
  }

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

  // Fonction utilitaire pour normaliser le domaine
  const normalizeHostname = (url) => {
      const hostname = new URL(url).hostname;
      // Supprime 'www.' au début du nom d'hôte pour la comparaison
      return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
  };
    try {
      const response = await axios.get(pageUrl, {
        timeout: REQUEST_TIMEOUT,
        responseType: 'text', // Force text response (not JSON)
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept 4xx errors
      });

      // Log response info for debugging
      const contentType = response.headers['content-type'] || 'unknown';
      const htmlSize = typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length;
      logger.info(`Fetched ${pageUrl}: ${response.status}, Content-Type: ${contentType}, Size: ${htmlSize} bytes`);

      const $ = cheerio.load(response.data);
      const links = [];
      const baseDomainNormalized = normalizeHostname(baseUrl);

      // Extract all links
      let totalLinksFound = 0;
      let internalLinksCount = 0;

      $('a[href]').each((index, element) => {
        const href = $(element).attr('href');
        const anchor = $(element).text().trim();

        if (!href) return;

        totalLinksFound++;

        // Filter 1: Check if valid link (not mailto, tel, anchor, etc.)
        if (!this.isValidLink(href)) {
          return;
        }

        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, pageUrl).href;
          const linkDomainNormalized = normalizeHostname(absoluteUrl);

          // Debug logging for first few links of first page
          if (index < 5 && pageUrl.includes(baseDomainNormalized.split('/')[0])) {
            logger.info(`  Link #${index}: href="${href}"`);
            logger.info(`    -> Absolute: "${absoluteUrl}"`);
            logger.info(`    -> Base: "${baseDomainNormalized}" vs Link: "${linkDomainNormalized}"`);
            logger.info(`    -> Match: ${linkDomainNormalized === baseDomainNormalized}`);
          }

          // Only process internal links (same domain)
          if (linkDomainNormalized === baseDomainNormalized) {
            // Filter 2: Exclude media files
            if (this.isMediaFile(absoluteUrl)) {
              logger.debug(`  Skipping media file: ${absoluteUrl}`);
              return;
            }

            // Filter 3: Only include links in main content (not header/footer)
            if (!this.isInMainContent($, element)) {
              logger.debug(`  Skipping non-content link: ${absoluteUrl}`);
              return;
            }

            internalLinksCount++;

            // Remove hash and trailing slash for consistency
            const cleanUrl = absoluteUrl.split('#')[0].replace(/\/$/, '');

            links.push({
              url: cleanUrl,
              anchor: anchor || '(no anchor text)',
              status: null, // Will be checked later
              redirectUrl: null,
              isCta: this.isCtaButton($, element), // Mark CTA buttons
            });
          }
        } catch (e) {
          // Log first few invalid URLs for debugging
          if (index < 5) {
            logger.info(`  Invalid URL: ${href} - ${e.message}`);
          }
        }
      });

      logger.info(`Page ${pageUrl}: Found ${totalLinksFound} total <a href> tags, ${internalLinksCount} matching internal links`);

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
   * Check HTTP status of a URL (follows redirects to get final status)
   * @param {string} url - URL to check
   * @returns {Promise<Object>} Status info
   */
  static async checkUrlStatus(url) {
    try {
      // Use GET with redirect following to get final status
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': USER_AGENT,
        },
        maxRedirects: 5, // Follow redirects to get final status
        validateStatus: () => true, // Accept all status codes
      });

      const result = {
        url,
        status: response.status, // Final status after redirects
        redirectUrl: null,
      };

      // Check if URL was redirected
      if (response.request?.res?.responseUrl && response.request.res.responseUrl !== url) {
        result.redirectUrl = response.request.res.responseUrl;
      }

      return result;
    } catch (error) {
      // Fallback to HEAD request if GET fails
      try {
        const headResponse = await axios.head(url, {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'User-Agent': USER_AGENT,
          },
          maxRedirects: 5,
          validateStatus: () => true,
        });

        return {
          url,
          status: headResponse.status,
          redirectUrl: null,
        };
      } catch (headError) {
        return {
          url,
          status: 0,
          error: error.message,
        };
      }
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
