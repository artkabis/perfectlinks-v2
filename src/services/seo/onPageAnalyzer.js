/**
 * On-Page SEO Analyzer
 * Extracts and analyzes on-page SEO elements (title, meta, Hn, images, etc.)
 */

const logger = require('../../utils/logger');

class OnPageAnalyzer {
  /**
   * Extract all on-page SEO metadata from a page
   * @param {CheerioAPI} $ - Cheerio instance with loaded HTML
   * @param {string} pageUrl - URL of the page being analyzed
   * @returns {Object} On-page SEO data
   */
  static analyze($, pageUrl) {
    try {
      const result = {
        url: pageUrl,
        title: this.extractTitle($),
        metaDescription: this.extractMetaDescription($),
        metaRobots: this.extractMetaRobots($),
        canonical: this.extractCanonical($, pageUrl),
        headings: this.extractHeadings($),
        images: this.analyzeImages($),
        openGraph: this.extractOpenGraph($),
        schema: this.extractSchema($),
        lang: this.extractLang($),
      };

      // Add computed fields
      result.seoIssues = this.detectIssues(result);

      return result;
    } catch (error) {
      logger.error(`Error analyzing on-page SEO for ${pageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Extract page title
   */
  static extractTitle($) {
    const title = $('title').first().text().trim();
    return {
      text: title,
      length: title.length,
      isEmpty: !title,
      isTooShort: title.length > 0 && title.length < 30,
      isTooLong: title.length > 60,
      isOptimal: title.length >= 30 && title.length <= 60,
    };
  }

  /**
   * Extract meta description
   */
  static extractMetaDescription($) {
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    return {
      text: metaDesc.trim(),
      length: metaDesc.length,
      isEmpty: !metaDesc,
      isTooShort: metaDesc.length > 0 && metaDesc.length < 120,
      isTooLong: metaDesc.length > 160,
      isOptimal: metaDesc.length >= 120 && metaDesc.length <= 160,
    };
  }

  /**
   * Extract meta robots
   */
  static extractMetaRobots($) {
    const robots = $('meta[name="robots"]').attr('content') || '';
    const isIndexable = !robots.toLowerCase().includes('noindex');
    const isFollowable = !robots.toLowerCase().includes('nofollow');

    return {
      content: robots,
      isIndexable,
      isFollowable,
    };
  }

  /**
   * Extract canonical URL
   */
  static extractCanonical($, pageUrl) {
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    const canonicalIsSelf = canonical === pageUrl || canonical === pageUrl.replace(/\/$/, '');

    return {
      url: canonical,
      exists: !!canonical,
      isSelf: canonicalIsSelf,
      isDifferent: canonical && !canonicalIsSelf,
    };
  }

  /**
   * Extract all heading tags (H1-H6)
   */
  static extractHeadings($) {
    const headings = {
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
    };

    // Extract each heading level
    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((index, element) => {
        const text = $(element).text().trim();
        if (text) {
          headings[`h${i}`].push({
            text,
            length: text.length,
            position: index + 1,
          });
        }
      });
    }

    // Analyze structure
    const h1Count = headings.h1.length;
    const hasH1 = h1Count > 0;
    const hasMultipleH1 = h1Count > 1;
    const isStructureValid = this.validateHeadingStructure(headings);

    return {
      ...headings,
      counts: {
        h1: headings.h1.length,
        h2: headings.h2.length,
        h3: headings.h3.length,
        h4: headings.h4.length,
        h5: headings.h5.length,
        h6: headings.h6.length,
      },
      hasH1,
      hasMultipleH1,
      isStructureValid,
    };
  }

  /**
   * Validate heading hierarchy (H1 > H2 > H3...)
   */
  static validateHeadingStructure(headings) {
    // Simple validation: check if H1 exists and structure is coherent
    if (headings.h1.length === 0) return false;
    if (headings.h1.length > 1) return false;

    // Could add more complex validation here
    return true;
  }

  /**
   * Analyze images (count, alt attributes, etc.)
   */
  static analyzeImages($) {
    const images = [];
    let withoutAlt = 0;

    $('img').each((index, element) => {
      const $img = $(element);
      const src = $img.attr('src') || '';
      const alt = $img.attr('alt') || '';
      const title = $img.attr('title') || '';

      if (!alt) withoutAlt++;

      images.push({
        src,
        alt,
        title,
        hasAlt: !!alt,
        hasTitle: !!title,
      });
    });

    return {
      total: images.length,
      withoutAlt,
      withAlt: images.length - withoutAlt,
      altCoverage: images.length > 0 ? ((images.length - withoutAlt) / images.length * 100).toFixed(1) : 100,
      list: images,
    };
  }

  /**
   * Extract Open Graph metadata
   */
  static extractOpenGraph($) {
    return {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: $('meta[property="og:url"]').attr('content') || '',
      type: $('meta[property="og:type"]').attr('content') || '',
      siteName: $('meta[property="og:site_name"]').attr('content') || '',
    };
  }

  /**
   * Extract Schema.org structured data
   */
  static extractSchema($) {
    const schemas = [];

    $('script[type="application/ld+json"]').each((index, element) => {
      try {
        const content = $(element).html();
        const json = JSON.parse(content);
        const type = json['@type'] || (Array.isArray(json) ? json.map(item => item['@type']).join(', ') : 'Unknown');
        schemas.push({
          type,
          content: json,
        });
      } catch (e) {
        logger.debug('Error parsing schema:', e.message);
      }
    });

    return {
      count: schemas.length,
      types: schemas.map(s => s.type),
      schemas,
    };
  }

  /**
   * Extract language attribute
   */
  static extractLang($) {
    return $('html').attr('lang') || '';
  }

  /**
   * Detect on-page SEO issues
   */
  static detectIssues(data) {
    const issues = [];

    // Title issues
    if (data.title.isEmpty) {
      issues.push({ severity: 'high', type: 'missing_title', message: 'Aucun titre trouvé' });
    } else if (data.title.isTooShort) {
      issues.push({ severity: 'medium', type: 'short_title', message: `Titre trop court (${data.title.length} caractères, min 30)` });
    } else if (data.title.isTooLong) {
      issues.push({ severity: 'medium', type: 'long_title', message: `Titre trop long (${data.title.length} caractères, max 60)` });
    }

    // Meta description issues
    if (data.metaDescription.isEmpty) {
      issues.push({ severity: 'high', type: 'missing_meta_description', message: 'Meta description manquante' });
    } else if (data.metaDescription.isTooShort) {
      issues.push({ severity: 'medium', type: 'short_meta_description', message: `Meta description trop courte (${data.metaDescription.length} caractères, min 120)` });
    } else if (data.metaDescription.isTooLong) {
      issues.push({ severity: 'low', type: 'long_meta_description', message: `Meta description trop longue (${data.metaDescription.length} caractères, max 160)` });
    }

    // H1 issues
    if (!data.headings.hasH1) {
      issues.push({ severity: 'high', type: 'missing_h1', message: 'Aucun H1 trouvé' });
    } else if (data.headings.hasMultipleH1) {
      issues.push({ severity: 'medium', type: 'multiple_h1', message: `${data.headings.counts.h1} H1 trouvés (recommandé : 1 seul)` });
    }

    // Image issues
    if (data.images.withoutAlt > 0) {
      issues.push({ severity: 'medium', type: 'images_without_alt', message: `${data.images.withoutAlt} images sans attribut alt` });
    }

    // Canonical issues
    if (!data.canonical.exists) {
      issues.push({ severity: 'low', type: 'missing_canonical', message: 'Balise canonical manquante' });
    }

    // Indexability issues
    if (!data.metaRobots.isIndexable) {
      issues.push({ severity: 'high', type: 'noindex', message: 'Page en noindex (non indexable)' });
    }

    return issues;
  }
}

module.exports = OnPageAnalyzer;
