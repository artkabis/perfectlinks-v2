import { ExternalLink as ExternalLinkIcon, Link2 } from 'lucide-react';
import { Card, CardHeader, CardBody, StatusBadge } from '@/components/ui';

const ExternalLinks = ({ internalLinks }) => {
  // Extract all external links from all pages
  const externalLinks = [];

  internalLinks.forEach((page) => {
    page.internalLinks.forEach((link) => {
      // Check if link is external
      try {
        const pageUrl = new URL(page.link);
        const linkUrl = new URL(link.url);

        const pageDomain = pageUrl.hostname.replace(/^www\./, '');
        const linkDomain = linkUrl.hostname.replace(/^www\./, '');

        if (pageDomain !== linkDomain) {
          externalLinks.push({
            sourceUrl: page.link,
            targetUrl: link.url,
            anchor: link.anchor,
            status: link.status,
            domain: linkDomain,
          });
        }
      } catch (error) {
        // Not a valid URL
      }
    });
  });

  // Group by domain
  const linksByDomain = externalLinks.reduce((acc, link) => {
    if (!acc[link.domain]) {
      acc[link.domain] = [];
    }
    acc[link.domain].push(link);
    return acc;
  }, {});

  const domains = Object.keys(linksByDomain).sort();

  if (externalLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Liens externes
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Link2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">
              Aucun lien externe détecté
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Tous les liens pointent vers le même domaine.
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
            <Link2 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Liens externes ({externalLinks.length})
            </h3>
          </div>
          <span className="text-sm text-gray-600">
            {domains.length} domaine(s) différent(s)
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-6 max-h-[600px] overflow-y-auto">
          {domains.map((domain) => {
            const links = linksByDomain[domain];
            return (
              <div key={domain} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{domain}</h4>
                  <span className="text-sm text-gray-500">
                    {links.length} lien(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {link.targetUrl}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            Depuis: {link.sourceUrl}
                          </p>
                          {link.anchor && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ancre: "{link.anchor}"
                            </p>
                          )}
                        </div>
                        <a
                          href={link.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                        </a>
                      </div>
                      {link.status !== null && (
                        <div>
                          <StatusBadge status={link.status} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default ExternalLinks;
