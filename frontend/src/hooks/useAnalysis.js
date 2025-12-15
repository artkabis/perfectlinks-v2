import { useState } from 'react';
import sitemapService from '@/services/sitemap';
import toast from 'react-hot-toast';

/**
 * Hook for sitemap analysis
 */
export const useAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const analyzeSitemap = async (sitemapUrl) => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      const result = await sitemapService.analyzeSitemap(sitemapUrl);

      clearInterval(progressInterval);
      setProgress(100);

      // Result is an array with one element
      const data = result[0];

      setAnalysisResult(data);
      toast.success('Analyse terminée avec succès !');

      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'analyse");
      toast.error(err.response?.data?.message || "Erreur lors de l'analyse");
      throw err;
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const reset = () => {
    setAnalysisResult(null);
    setError(null);
    setProgress(0);
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    progress,
    analyzeSitemap,
    reset,
  };
};

/**
 * Hook for fetching robots.txt
 */
export const useRobotsTxt = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [robotsData, setRobotsData] = useState(null);

  const fetchRobots = async (domain) => {
    setIsLoading(true);
    try {
      const result = await sitemapService.getRobotsTxt(domain);
      setRobotsData(result);

      if (result.success) {
        const sitemaps = sitemapService.extractSitemapsFromRobots(result.content);
        return { ...result, sitemaps };
      }

      return result;
    } catch (err) {
      toast.error('Erreur lors de la récupération du robots.txt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    robotsData,
    fetchRobots,
  };
};

export default useAnalysis;
