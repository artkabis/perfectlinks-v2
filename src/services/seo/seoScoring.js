/**
 * SEO Scoring
 * Calculates SEO scores and generates actionable recommendations
 */

const logger = require('../../utils/logger');

class SeoScoring {
  /**
   * Calculate overall SEO score for the site
   * @param {Array} pagesData - Array of pages with SEO analysis
   * @param {Object} linkingAnalysis - Linking structure analysis
   * @returns {Object} SEO scoring data
   */
  static calculateSiteScore(pagesData, linkingAnalysis) {
    try {
      const onPageScore = this.calculateOnPageScore(pagesData);
      const technicalScore = this.calculateTechnicalScore(pagesData);
      const contentScore = this.calculateContentScore(pagesData);
      const linkingScore = this.calculateLinkingScore(linkingAnalysis);

      const overallScore = Math.round(
        (onPageScore * 0.3) +
        (technicalScore * 0.2) +
        (contentScore * 0.3) +
        (linkingScore * 0.2)
      );

      return {
        overall: overallScore,
        breakdown: {
          onPage: onPageScore,
          technical: technicalScore,
          content: contentScore,
          linking: linkingScore,
        },
        issues: this.collectAllIssues(pagesData),
        opportunities: this.identifyOpportunities(pagesData, linkingAnalysis),
        priorities: this.prioritizeActions(pagesData, linkingAnalysis),
      };
    } catch (error) {
      logger.error('Error calculating SEO score:', error.message);
      return null;
    }
  }

  /**
   * Calculate on-page SEO score
   */
  static calculateOnPageScore(pagesData) {
    let totalScore = 0;
    let count = 0;

    pagesData.forEach(page => {
      if (!page.seo || !page.seo.onPage) return;

      let pageScore = 100;
      const onPage = page.seo.onPage;

      // Title issues
      if (onPage.title.isEmpty) pageScore -= 20;
      else if (onPage.title.isTooShort || onPage.title.isTooLong) pageScore -= 5;

      // Meta description issues
      if (onPage.metaDescription.isEmpty) pageScore -= 15;
      else if (onPage.metaDescription.isTooShort || onPage.metaDescription.isTooLong) pageScore -= 3;

      // H1 issues
      if (!onPage.headings.hasH1) pageScore -= 15;
      else if (onPage.headings.hasMultipleH1) pageScore -= 5;

      // Image alt issues
      if (onPage.images.total > 0 && onPage.images.withoutAlt > 0) {
        const altPenalty = (onPage.images.withoutAlt / onPage.images.total) * 10;
        pageScore -= altPenalty;
      }

      // Canonical issues
      if (!onPage.canonical.exists) pageScore -= 5;

      totalScore += Math.max(0, pageScore);
      count++;
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  /**
   * Calculate technical SEO score
   */
  static calculateTechnicalScore(pagesData) {
    let totalScore = 0;
    let count = 0;

    pagesData.forEach(page => {
      if (!page.seo || !page.seo.onPage) return;

      let pageScore = 100;
      const onPage = page.seo.onPage;

      // Indexability
      if (!onPage.metaRobots.isIndexable) pageScore -= 50; // Major issue

      // Canonical
      if (!onPage.canonical.exists) pageScore -= 10;

      // Language
      if (!onPage.lang) pageScore -= 5;

      // Schema.org
      if (onPage.schema.count === 0) pageScore -= 10;

      totalScore += Math.max(0, pageScore);
      count++;
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  /**
   * Calculate content quality score
   */
  static calculateContentScore(pagesData) {
    let totalScore = 0;
    let count = 0;

    pagesData.forEach(page => {
      if (!page.seo || !page.seo.content) return;

      const contentQuality = page.seo.content.quality;
      totalScore += contentQuality.score;
      count++;
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  /**
   * Calculate linking structure score
   */
  static calculateLinkingScore(linkingAnalysis) {
    if (!linkingAnalysis || !linkingAnalysis.summary) return 0;

    let score = 100;
    const summary = linkingAnalysis.summary;

    // Penalize orphan pages
    const orphanRatio = summary.orphanPages / summary.totalPages;
    score -= orphanRatio * 30;

    // Penalize weak pages
    const weakRatio = summary.weakPages / summary.totalPages;
    score -= weakRatio * 20;

    // Penalize deep pages
    const deepRatio = summary.deepPages / summary.totalPages;
    score -= deepRatio * 15;

    // Penalize dead ends
    const deadEndRatio = summary.deadEnds / summary.totalPages;
    score -= deadEndRatio * 10;

    return Math.max(0, Math.round(score));
  }

  /**
   * Collect all SEO issues across the site
   */
  static collectAllIssues(pagesData) {
    const issues = {
      high: [],
      medium: [],
      low: [],
    };

    pagesData.forEach(page => {
      if (!page.seo || !page.seo.onPage) return;

      const pageIssues = page.seo.onPage.seoIssues || [];
      pageIssues.forEach(issue => {
        issues[issue.severity].push({
          ...issue,
          url: page.link,
        });
      });
    });

    return {
      high: issues.high,
      medium: issues.medium,
      low: issues.low,
      total: issues.high.length + issues.medium.length + issues.low.length,
      byType: this.groupIssuesByType(issues),
    };
  }

  /**
   * Group issues by type
   */
  static groupIssuesByType(issues) {
    const grouped = {};

    ['high', 'medium', 'low'].forEach(severity => {
      issues[severity].forEach(issue => {
        if (!grouped[issue.type]) {
          grouped[issue.type] = { count: 0, severity, urls: [] };
        }
        grouped[issue.type].count++;
        grouped[issue.type].urls.push(issue.url);
      });
    });

    return grouped;
  }

  /**
   * Identify SEO opportunities
   */
  static identifyOpportunities(pagesData, linkingAnalysis) {
    const opportunities = [];

    // Orphan pages opportunity
    if (linkingAnalysis && linkingAnalysis.summary.orphanPages > 0) {
      opportunities.push({
        type: 'orphan_pages',
        count: linkingAnalysis.summary.orphanPages,
        impact: 'high',
        effort: 'low',
        action: 'Créer des liens internes vers ces pages orphelines',
        pages: linkingAnalysis.summary.orphanPagesList,
      });
    }

    // Thin content opportunity
    const thinContentPages = pagesData.filter(p =>
      p.seo && p.seo.content && p.seo.content.quality.quality === 'thin'
    );

    if (thinContentPages.length > 0) {
      opportunities.push({
        type: 'thin_content',
        count: thinContentPages.length,
        impact: 'medium',
        effort: 'high',
        action: 'Enrichir le contenu de ces pages (< 300 mots)',
        pages: thinContentPages.map(p => p.link),
      });
    }

    // Missing meta descriptions
    const noMetaDesc = pagesData.filter(p =>
      p.seo && p.seo.onPage && p.seo.onPage.metaDescription.isEmpty
    );

    if (noMetaDesc.length > 0) {
      opportunities.push({
        type: 'missing_meta_description',
        count: noMetaDesc.length,
        impact: 'medium',
        effort: 'low',
        action: 'Ajouter des meta descriptions',
        pages: noMetaDesc.map(p => p.link),
      });
    }

    // Missing H1
    const noH1 = pagesData.filter(p =>
      p.seo && p.seo.onPage && !p.seo.onPage.headings.hasH1
    );

    if (noH1.length > 0) {
      opportunities.push({
        type: 'missing_h1',
        count: noH1.length,
        impact: 'high',
        effort: 'low',
        action: 'Ajouter un H1 unique sur chaque page',
        pages: noH1.map(p => p.link),
      });
    }

    // Deep pages
    if (linkingAnalysis && linkingAnalysis.summary.deepPages > 0) {
      opportunities.push({
        type: 'deep_pages',
        count: linkingAnalysis.summary.deepPages,
        impact: 'medium',
        effort: 'medium',
        action: 'Réduire la profondeur de crawl (< 3 clics depuis l\'accueil)',
        pages: linkingAnalysis.crawlDepth.deepPages.map(p => p.url),
      });
    }

    return opportunities;
  }

  /**
   * Prioritize actions by impact/effort matrix
   */
  static prioritizeActions(pagesData, linkingAnalysis) {
    const opportunities = this.identifyOpportunities(pagesData, linkingAnalysis);

    // Score: high impact + low effort = highest priority
    const impactScore = { high: 3, medium: 2, low: 1 };
    const effortScore = { low: 3, medium: 2, high: 1 };

    const prioritized = opportunities.map(opp => ({
      ...opp,
      priority: impactScore[opp.impact] + effortScore[opp.effort],
    }))
    .sort((a, b) => b.priority - a.priority)
    .map((opp, index) => ({
      rank: index + 1,
      task: opp.action,
      type: opp.type,
      count: opp.count,
      impact: opp.impact,
      effort: opp.effort,
      pages: opp.pages,
    }));

    return prioritized;
  }

  /**
   * Generate benchmark statistics
   */
  static generateBenchmark(pagesData) {
    const stats = {
      avgTitleLength: 0,
      avgMetaDescLength: 0,
      avgWordCount: 0,
      avgInternalLinks: 0,
      pagesWithH1: 0,
      pagesWithMetaDesc: 0,
      pagesWithCanonical: 0,
      totalPages: pagesData.length,
    };

    let titleSum = 0, metaSum = 0, wordSum = 0, linksSum = 0;

    pagesData.forEach(page => {
      if (!page.seo) return;

      if (page.seo.onPage) {
        titleSum += page.seo.onPage.title.length;
        metaSum += page.seo.onPage.metaDescription.length;

        if (page.seo.onPage.headings.hasH1) stats.pagesWithH1++;
        if (!page.seo.onPage.metaDescription.isEmpty) stats.pagesWithMetaDesc++;
        if (page.seo.onPage.canonical.exists) stats.pagesWithCanonical++;
      }

      if (page.seo.content) {
        wordSum += page.seo.content.text.wordCount;
      }

      if (page.internalLinks) {
        linksSum += page.internalLinks.length;
      }
    });

    const count = pagesData.length;
    if (count > 0) {
      stats.avgTitleLength = Math.round(titleSum / count);
      stats.avgMetaDescLength = Math.round(metaSum / count);
      stats.avgWordCount = Math.round(wordSum / count);
      stats.avgInternalLinks = Math.round(linksSum / count);
      stats.pagesWithH1Percent = Math.round((stats.pagesWithH1 / count) * 100);
      stats.pagesWithMetaDescPercent = Math.round((stats.pagesWithMetaDesc / count) * 100);
      stats.pagesWithCanonicalPercent = Math.round((stats.pagesWithCanonical / count) * 100);
    }

    return stats;
  }
}

module.exports = SeoScoring;
