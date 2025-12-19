/**
 * Linking Analyzer
 * Analyzes internal linking structure: anchor texts, link distribution, depth, etc.
 */

const logger = require('../../utils/logger');

class LinkingAnalyzer {
  /**
   * Analyze linking structure across all pages
   * @param {Array} pagesData - Array of page analysis results from sitemap
   * @returns {Object} Linking analysis data
   */
  static analyzeGlobal(pagesData) {
    try {
      const linkGraph = this.buildLinkGraph(pagesData);
      const anchorAnalysis = this.analyzeAnchorTexts(pagesData);
      const depthAnalysis = this.calculateCrawlDepth(pagesData);
      const distributionAnalysis = this.analyzePageRankDistribution(linkGraph);

      return {
        linkGraph,
        anchorTexts: anchorAnalysis,
        crawlDepth: depthAnalysis,
        pageRank: distributionAnalysis,
        summary: this.generateLinkingSummary(linkGraph, depthAnalysis),
      };
    } catch (error) {
      logger.error('Error analyzing linking structure:', error.message);
      return null;
    }
  }

  /**
   * Build link graph (who links to whom)
   */
  static buildLinkGraph(pagesData) {
    const graph = new Map();

    // Initialize graph with all pages
    pagesData.forEach(page => {
      if (!graph.has(page.link)) {
        graph.set(page.link, {
          url: page.link,
          outgoingLinks: [],
          incomingLinks: [],
          incomingCount: 0,
          outgoingCount: 0,
        });
      }
    });

    // Build connections
    pagesData.forEach(page => {
      const fromUrl = page.link;
      const links = page.internalLinks || [];

      links.forEach(link => {
        const toUrl = link.url;

        // Add to outgoing links
        const fromNode = graph.get(fromUrl);
        if (fromNode && !fromNode.outgoingLinks.includes(toUrl)) {
          fromNode.outgoingLinks.push(toUrl);
          fromNode.outgoingCount++;
        }

        // Add to incoming links
        if (!graph.has(toUrl)) {
          graph.set(toUrl, {
            url: toUrl,
            outgoingLinks: [],
            incomingLinks: [],
            incomingCount: 0,
            outgoingCount: 0,
          });
        }

        const toNode = graph.get(toUrl);
        if (!toNode.incomingLinks.includes(fromUrl)) {
          toNode.incomingLinks.push(fromUrl);
          toNode.incomingCount++;
        }
      });
    });

    return graph;
  }

  /**
   * Analyze anchor texts used across the site
   */
  static analyzeAnchorTexts(pagesData) {
    const anchorFrequency = new Map();
    const anchorsByUrl = new Map();

    pagesData.forEach(page => {
      const links = page.internalLinks || [];

      links.forEach(link => {
        const anchor = link.anchor || '(no anchor text)';
        const targetUrl = link.url;

        // Global frequency
        if (!anchorFrequency.has(anchor)) {
          anchorFrequency.set(anchor, { text: anchor, count: 0, urls: new Set() });
        }
        const anchorData = anchorFrequency.get(anchor);
        anchorData.count++;
        anchorData.urls.add(targetUrl);

        // Per URL
        if (!anchorsByUrl.has(targetUrl)) {
          anchorsByUrl.set(targetUrl, new Map());
        }
        const urlAnchors = anchorsByUrl.get(targetUrl);
        urlAnchors.set(anchor, (urlAnchors.get(anchor) || 0) + 1);
      });
    });

    // Detect problematic anchors
    const problematicAnchors = [];
    const genericAnchors = [
      'cliquez ici', 'click here', 'ici', 'here',
      'lire plus', 'read more', 'en savoir plus', 'learn more',
      'voir plus', 'see more', 'plus', 'more',
      'suite', 'continuer', 'continue',
    ];

    anchorFrequency.forEach((data, anchor) => {
      const lowerAnchor = anchor.toLowerCase();
      if (genericAnchors.some(generic => lowerAnchor.includes(generic))) {
        problematicAnchors.push({
          anchor,
          count: data.count,
          issue: 'Ancre générique (peu SEO)',
          recommendation: 'Utiliser des ancres descriptives avec mots-clés',
        });
      }
    });

    // Top anchors
    const topAnchors = Array.from(anchorFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map(a => ({ text: a.text, count: a.count, targetCount: a.urls.size }));

    return {
      totalAnchors: anchorFrequency.size,
      topAnchors,
      problematicAnchors,
      anchorsByUrl: Object.fromEntries(
        Array.from(anchorsByUrl.entries()).map(([url, anchors]) => [
          url,
          Array.from(anchors.entries()).map(([text, count]) => ({ text, count }))
        ])
      ),
    };
  }

  /**
   * Calculate crawl depth for each page (distance from homepage)
   */
  static calculateCrawlDepth(pagesData) {
    const depths = new Map();
    const visited = new Set();
    const queue = [];

    // Find homepage (usually first URL or contains just domain)
    const homepage = pagesData[0]?.link || '';

    // BFS to calculate depth
    depths.set(homepage, 0);
    queue.push({ url: homepage, depth: 0 });

    while (queue.length > 0) {
      const { url, depth } = queue.shift();

      if (visited.has(url)) continue;
      visited.add(url);

      const page = pagesData.find(p => p.link === url);
      if (!page) continue;

      const links = page.internalLinks || [];
      links.forEach(link => {
        const targetUrl = link.url;
        if (!depths.has(targetUrl) || depths.get(targetUrl) > depth + 1) {
          depths.set(targetUrl, depth + 1);
          queue.push({ url: targetUrl, depth: depth + 1 });
        }
      });
    }

    // Analyze depth distribution
    const distribution = {};
    depths.forEach((depth, url) => {
      if (!distribution[depth]) distribution[depth] = 0;
      distribution[depth]++;
    });

    const deepPages = Array.from(depths.entries())
      .filter(([url, depth]) => depth > 3)
      .map(([url, depth]) => ({ url, depth }));

    return {
      homepage,
      depths: Object.fromEntries(depths),
      distribution,
      deepPages,
      avgDepth: depths.size > 0 ? Array.from(depths.values()).reduce((a, b) => a + b, 0) / depths.size : 0,
    };
  }

  /**
   * Calculate simplified PageRank distribution
   */
  static analyzePageRankDistribution(linkGraph) {
    const pageRank = new Map();
    const dampingFactor = 0.85;
    const iterations = 10;

    // Initialize PageRank
    const totalPages = linkGraph.size;
    linkGraph.forEach((node, url) => {
      pageRank.set(url, 1 / totalPages);
    });

    // Iterative PageRank calculation
    for (let i = 0; i < iterations; i++) {
      const newPageRank = new Map();

      linkGraph.forEach((node, url) => {
        let rank = (1 - dampingFactor) / totalPages;

        // Add contribution from incoming links
        node.incomingLinks.forEach(incomingUrl => {
          const incomingNode = linkGraph.get(incomingUrl);
          if (incomingNode && incomingNode.outgoingCount > 0) {
            rank += dampingFactor * (pageRank.get(incomingUrl) / incomingNode.outgoingCount);
          }
        });

        newPageRank.set(url, rank);
      });

      // Update PageRank
      newPageRank.forEach((rank, url) => pageRank.set(url, rank));
    }

    // Categorize pages by PageRank
    const sorted = Array.from(pageRank.entries())
      .sort((a, b) => b[1] - a[1]);

    const topPages = sorted.slice(0, 10).map(([url, rank]) => ({
      url,
      pageRank: rank.toFixed(6),
      category: 'high',
    }));

    const weakPages = sorted.slice(-10).map(([url, rank]) => ({
      url,
      pageRank: rank.toFixed(6),
      category: 'low',
    }));

    return {
      pageRank: Object.fromEntries(
        Array.from(pageRank.entries()).map(([url, rank]) => [url, rank.toFixed(6)])
      ),
      topPages,
      weakPages,
    };
  }

  /**
   * Generate linking summary with key metrics
   */
  static generateLinkingSummary(linkGraph, depthAnalysis) {
    const orphanPages = [];
    const weakPages = [];
    const hubPages = [];
    const deadEnds = [];

    linkGraph.forEach((node, url) => {
      if (node.incomingCount === 0) {
        orphanPages.push(url);
      } else if (node.incomingCount < 3) {
        weakPages.push({ url, incomingCount: node.incomingCount });
      }

      if (node.outgoingCount > 10) {
        hubPages.push({ url, outgoingCount: node.outgoingCount });
      } else if (node.outgoingCount === 0) {
        deadEnds.push(url);
      }
    });

    return {
      totalPages: linkGraph.size,
      orphanPages: orphanPages.length,
      orphanPagesList: orphanPages,
      weakPages: weakPages.length,
      weakPagesList: weakPages,
      hubPages: hubPages.length,
      hubPagesList: hubPages,
      deadEnds: deadEnds.length,
      deadEndsList: deadEnds,
      avgDepth: depthAnalysis.avgDepth.toFixed(2),
      deepPages: depthAnalysis.deepPages.length,
    };
  }
}

module.exports = LinkingAnalyzer;
