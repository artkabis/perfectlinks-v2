import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui';

const OrphanPages = ({ orphanLinks }) => {
  if (!orphanLinks || orphanLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-success-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Pages orphelines
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-success-600" />
            </div>
            <p className="text-gray-600 font-medium">
              ✓ Aucune page orpheline détectée !
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Toutes les pages du sitemap ont au moins un lien interne pointant vers elles.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Pages orphelines ({orphanLinks.length})
            </h3>
          </div>
          <span className="text-sm text-gray-600">
            Pages sans lien interne entrant
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {orphanLinks.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg hover:bg-warning-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {url}
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary-600 hover:text-primary-700 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Qu'est-ce qu'une page orpheline ?</strong><br />
            Une page orpheline est une page présente dans le sitemap mais qui n'a aucun lien interne depuis d'autres pages du site.
            Cela peut nuire au SEO et à l'expérience utilisateur.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default OrphanPages;
