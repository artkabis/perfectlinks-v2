/**
 * Content Analyzer
 * Analyzes textual content: word count, reading time, keywords, semantic analysis
 */

const logger = require('../../utils/logger');

class ContentAnalyzer {
  /**
   * Analyze page content
   * @param {CheerioAPI} $ - Cheerio instance with loaded HTML
   * @param {string} pageUrl - URL of the page being analyzed
   * @returns {Object} Content analysis data
   */
  static analyze($, pageUrl) {
    try {
      // Extract main content text
      const mainContent = this.extractMainContent($);

      return {
        url: pageUrl,
        text: {
          wordCount: this.countWords(mainContent),
          characterCount: mainContent.length,
          readingTime: this.calculateReadingTime(mainContent),
        },
        keywords: this.extractKeywords(mainContent),
        quality: this.assessContentQuality(mainContent),
      };
    } catch (error) {
      logger.error(`Error analyzing content for ${pageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Extract main content text (excluding header, footer, nav, scripts)
   */
  static extractMainContent($) {
    // Clone the DOM to avoid modifying the original
    const $content = $.root().clone();

    // Remove unwanted elements
    $content.find('script, style, header, footer, nav, .header, .footer, .nav, .navigation, .menu, .sidebar, .widget, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();

    // Try to find main content area
    let mainText = '';
    const mainSelectors = [
      'main',
      'article',
      '#main-content',
      '#dm_content',
      '#Content',
      '.entry-layout',
      '.main-page',
      '.content',
      '.post-content',
      '.entry-content',
      '[role="main"]',
    ];

    // Try each selector
    for (const selector of mainSelectors) {
      const $main = $content.find(selector);
      if ($main.length > 0) {
        mainText = $main.text();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!mainText) {
      mainText = $content.find('body').text();
    }

    // Clean up text (remove extra whitespace)
    return mainText.replace(/\s+/g, ' ').trim();
  }

  /**
   * Count words in text
   */
  static countWords(text) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  }

  /**
   * Calculate reading time (assuming 200 words per minute)
   */
  static calculateReadingTime(text) {
    const wordCount = this.countWords(text);
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return {
      minutes,
      formatted: minutes === 1 ? '1 min' : `${minutes} min`,
    };
  }

  /**
   * Extract top keywords using simple frequency analysis
   * (Simple TF - Term Frequency)
   */
  static extractKeywords(text, topN = 10) {
    if (!text) return [];

    // Normalize text
    const normalized = text.toLowerCase();

    // French stop words (mots vides)
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
      'donc', 'or', 'ni', 'car', 'ce', 'ces', 'cet', 'cette', 'dans', 'sur',
      'pour', 'par', 'avec', 'sans', 'sous', 'vers', 'chez', 'être', 'avoir',
      'faire', 'dire', 'aller', 'voir', 'pouvoir', 'vouloir', 'venir', 'devoir',
      'prendre', 'donner', 'falloir', 'mettre', 'croire', 'tenir', 'devenir',
      'au', 'aux', 'à', 'en', 'est', 'sont', 'été', 'était', 'ont', 'peut',
      'plus', 'très', 'tout', 'tous', 'toute', 'toutes', 'pas', 'ne', 'que',
      'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'si', 'comme',
      'son', 'sa', 'ses', 'leur', 'leurs', 'notre', 'nos', 'votre', 'vos',
      'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'il', 'ils', 'elle', 'elles',
      'je', 'tu', 'nous', 'vous', 'lui', 'eux', 'on', 'cela', 'ça', 'aussi',
      'bien', 'même', 'encore', 'ainsi', 'alors', 'après', 'avant', 'ici',
      'là', 'maintenant', 'déjà', 'jamais', 'toujours', 'souvent', 'parfois',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
    ]);

    // Extract words (2+ characters)
    const words = normalized.match(/\b[a-zàâäéèêëïîôùûüÿæœç]{2,}\b/g) || [];

    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Sort by frequency and take top N
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    const totalWords = words.length;

    return sorted.map(([keyword, count]) => ({
      keyword,
      frequency: count,
      density: totalWords > 0 ? ((count / totalWords) * 100).toFixed(2) + '%' : '0%',
    }));
  }

  /**
   * Assess content quality based on word count
   */
  static assessContentQuality(text) {
    const wordCount = this.countWords(text);

    let quality = 'unknown';
    let score = 0;
    let issues = [];

    if (wordCount === 0) {
      quality = 'empty';
      score = 0;
      issues.push('Aucun contenu détecté');
    } else if (wordCount < 300) {
      quality = 'thin';
      score = 30;
      issues.push(`Contenu trop court (${wordCount} mots, min recommandé : 300)`);
    } else if (wordCount < 600) {
      quality = 'short';
      score = 60;
      issues.push(`Contenu court (${wordCount} mots, recommandé : 600+)`);
    } else if (wordCount < 1000) {
      quality = 'medium';
      score = 75;
    } else if (wordCount < 2000) {
      quality = 'good';
      score = 90;
    } else {
      quality = 'excellent';
      score = 100;
    }

    return {
      quality,
      score,
      wordCount,
      issues,
      recommendation: this.getContentRecommendation(wordCount),
    };
  }

  /**
   * Get content recommendation based on word count
   */
  static getContentRecommendation(wordCount) {
    if (wordCount === 0) {
      return 'Ajouter du contenu textuel à cette page';
    } else if (wordCount < 300) {
      return `Enrichir le contenu (actuel : ${wordCount} mots, objectif : 300+ mots)`;
    } else if (wordCount < 600) {
      return `Développer le contenu pour améliorer le SEO (objectif : 600+ mots)`;
    } else if (wordCount < 1000) {
      return 'Contenu correct, envisager d\'enrichir pour se démarquer';
    } else {
      return 'Contenu substantiel, continuez ainsi';
    }
  }

  /**
   * Calculate content similarity between two texts (Jaccard similarity)
   * Useful for detecting duplicate content
   */
  static calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
    const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

module.exports = ContentAnalyzer;
