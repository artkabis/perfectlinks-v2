import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import useAuthStore from '@/hooks/useAuth';
import SitemapAnalyzer from '@/components/dashboard/SitemapAnalyzer';
import AnalysisOverview from '@/components/analysis/AnalysisOverview';
import OrphanPages from '@/components/analysis/OrphanPages';
import PageLinksTable from '@/components/analysis/PageLinksTable';
import ExternalLinks from '@/components/analysis/ExternalLinks';
import ConversionLinks from '@/components/analysis/ConversionLinks';
import { Button, Card, CardBody } from '@/components/ui';

const Dashboard = () => {
  const { user, refreshUser } = useAuthStore();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Refresh user data on mount
    refreshUser().catch(console.error);
  }, [refreshUser]);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setActiveTab('overview');
  };

  const handleNewAnalysis = () => {
    setAnalysisResult(null);
    setActiveTab('overview');
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', show: true },
    { id: 'orphans', label: 'Pages orphelines', show: true, badge: analysisResult?.datas?.missingLinks?.length },
    { id: 'pages', label: 'Détail des pages', show: true },
    { id: 'external', label: 'Liens externes', show: true },
    { id: 'conversion', label: 'Liens de conversion', show: true },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue {user?.email} !
          </p>
        </div>
        {user && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Quota ce mois-ci</p>
            <p className="text-2xl font-bold text-gray-900">
              {user.requestsMade || 0} / {user.requestsLimit || 100}
            </p>
          </div>
        )}
      </div>

      {/* Analyzer */}
      <SitemapAnalyzer onAnalysisComplete={handleAnalysisComplete} />

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* New analysis button */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Résultats de l'analyse
            </h2>
            <Button
              variant="outline"
              onClick={handleNewAnalysis}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Nouvelle analyse
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="tabs">
              {tabs.filter(tab => tab.show).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <AnalysisOverview data={analysisResult} />

                {/* Quick summary */}
                <Card>
                  <CardBody>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Résumé rapide
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Pages dans le sitemap:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {analysisResult.datas.links.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Liens internes uniques:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {analysisResult.meta.totalInternalLinks}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pages orphelines:</span>
                        <span className={`ml-2 font-semibold ${
                          analysisResult.meta.orphanLinks > 0 ? 'text-warning-600' : 'text-success-600'
                        }`}>
                          {analysisResult.meta.orphanLinks}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Durée d'analyse:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {analysisResult.meta.duration}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'orphans' && (
              <OrphanPages orphanLinks={analysisResult.datas.missingLinks} />
            )}

            {activeTab === 'pages' && (
              <PageLinksTable internalLinks={analysisResult.datas.internalLinks} />
            )}

            {activeTab === 'external' && (
              <ExternalLinks internalLinks={analysisResult.datas.internalLinks} />
            )}

            {activeTab === 'conversion' && (
              <ConversionLinks internalLinks={analysisResult.datas.internalLinks} />
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!analysisResult && (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <RefreshCw className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Prêt à analyser votre site ?
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Entrez l'URL de votre sitemap ci-dessus pour commencer l'analyse du maillage interne de votre site web.
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
