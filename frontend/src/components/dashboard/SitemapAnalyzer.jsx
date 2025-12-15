import { useState } from 'react';
import { Search, FileText, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardBody, ProgressBar } from '@/components/ui';
import { useAnalysis, useRobotsTxt } from '@/hooks/useAnalysis';
import sitemapService from '@/services/sitemap';
import toast from 'react-hot-toast';

const SitemapAnalyzer = ({ onAnalysisComplete }) => {
  const [url, setUrl] = useState('');
  const [showRobots, setShowRobots] = useState(false);
  const { isAnalyzing, progress, analyzeSitemap } = useAnalysis();
  const { isLoading: isLoadingRobots, robotsData, fetchRobots } = useRobotsTxt();

  const handleCheckRobots = async () => {
    if (!url) {
      toast.error('Veuillez entrer une URL');
      return;
    }

    try {
      // Extract domain from URL
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = urlObj.origin;

      const result = await fetchRobots(domain);

      if (result.success && result.sitemaps.length > 0) {
        // Use the first sitemap found
        setUrl(result.sitemaps[0]);
        toast.success(`${result.sitemaps.length} sitemap(s) trouvé(s) dans robots.txt`);
      } else if (result.success) {
        toast.error('Aucun sitemap trouvé dans robots.txt');
      }

      setShowRobots(true);
    } catch (error) {
      toast.error('Erreur lors de la récupération du robots.txt');
    }
  };

  const handleAnalyze = async () => {
    if (!url) {
      toast.error('Veuillez entrer une URL de sitemap');
      return;
    }

    if (!sitemapService.isValidUrl(url)) {
      toast.error('URL invalide');
      return;
    }

    try {
      const result = await analyzeSitemap(url);
      onAnalysisComplete(result);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">
          Analyser un sitemap
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Entrez l'URL d'un site pour détecter automatiquement son sitemap, ou collez directement l'URL du sitemap.xml
        </p>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="https://example.com ou https://example.com/sitemap.xml"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              containerClassName="mb-0"
              disabled={isAnalyzing}
            />
            <Button
              variant="outline"
              onClick={handleCheckRobots}
              disabled={isAnalyzing || isLoadingRobots}
              isLoading={isLoadingRobots}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              robots.txt
            </Button>
          </div>

          {/* Robots.txt result */}
          {showRobots && robotsData && (
            <div className={`p-4 rounded-lg border ${
              robotsData.success ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'
            }`}>
              {robotsData.success ? (
                <div>
                  <p className="text-sm font-medium text-success-800 mb-2">
                    ✓ robots.txt trouvé
                  </p>
                  {robotsData.sitemaps && robotsData.sitemaps.length > 0 && (
                    <div className="text-sm text-success-700">
                      <p className="font-medium mb-1">Sitemaps détectés :</p>
                      <ul className="list-disc list-inside space-y-1">
                        {robotsData.sitemaps.map((sitemap, idx) => (
                          <li key={idx} className="truncate">{sitemap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-danger-800">
                    <p className="font-medium">robots.txt non trouvé</p>
                    <p className="mt-1">Veuillez entrer l'URL du sitemap.xml manuellement</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isAnalyzing && (
            <ProgressBar value={progress} max={100} />
          )}

          {/* Analyze button */}
          <Button
            variant="primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url}
            isLoading={isAnalyzing}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Search className="h-5 w-5" />
            {isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'analyse'}
          </Button>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Astuce :</strong> L'analyse peut prendre quelques minutes selon la taille du sitemap.
              Nous allons analyser toutes les pages et leurs liens internes.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SitemapAnalyzer;
