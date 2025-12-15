import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardBody, StatusBadge } from '@/components/ui';

const PageLinksTable = ({ internalLinks }) => {
  const [expandedPages, setExpandedPages] = useState({});
  const [filter, setFilter] = useState('all'); // all, with-links, no-links

  const togglePage = (index) => {
    setExpandedPages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const filteredPages = internalLinks.filter((page) => {
    if (filter === 'with-links') return page.internalLinks.length > 0;
    if (filter === 'no-links') return page.internalLinks.length === 0;
    return true;
  });

  // Detect external links and conversion links
  const categorizeLinks = (links, baseDomain) => {
    const internal = [];
    const external = [];
    const conversion = [];

    links.forEach((link) => {
      const url = link.url.toLowerCase();

      // Check for conversion links (tel:, mailto:, etc.)
      if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
        conversion.push(link);
      }
      // Check if external (different domain)
      else if (link.url.includes('://')) {
        try {
          const linkDomain = new URL(link.url).hostname.replace(/^www\./, '');
          const base = new URL(baseDomain).hostname.replace(/^www\./, '');
          if (linkDomain !== base) {
            external.push(link);
          } else {
            internal.push(link);
          }
        } catch {
          internal.push(link);
        }
      } else {
        internal.push(link);
      }
    });

    return { internal, external, conversion };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Détail des pages et leurs liens
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filtrer :</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input py-1 px-2 text-sm"
            >
              <option value="all">Toutes ({internalLinks.length})</option>
              <option value="with-links">
                Avec liens ({internalLinks.filter((p) => p.internalLinks.length > 0).length})
              </option>
              <option value="no-links">
                Sans liens ({internalLinks.filter((p) => p.internalLinks.length === 0).length})
              </option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredPages.map((page, index) => {
            const isExpanded = expandedPages[index];
            const hasLinks = page.internalLinks.length > 0;

            // Get base domain for categorization
            const baseDomain = page.link;

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Page header */}
                <button
                  onClick={() => togglePage(index)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {page.link}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {hasLinks ? `${page.internalLinks.length} lien(s) interne(s)` : 'Aucun lien'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={page.statusCode} />
                    <a
                      href={page.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </button>

                {/* Links table */}
                {isExpanded && hasLinks && (
                  <div className="p-4 bg-white">
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-header-cell">URL de destination</th>
                          <th className="table-header-cell">Texte d'ancre</th>
                          <th className="table-header-cell">Status</th>
                          <th className="table-header-cell w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.internalLinks.map((link, linkIndex) => (
                          <tr key={linkIndex} className="table-row">
                            <td className="table-cell">
                              <div className="max-w-md truncate text-sm">
                                {link.url}
                              </div>
                            </td>
                            <td className="table-cell">
                              <div className="max-w-xs truncate text-sm text-gray-600">
                                {link.anchor || '(pas de texte)'}
                              </div>
                            </td>
                            <td className="table-cell">
                              {link.status !== null && (
                                <StatusBadge status={link.status} />
                              )}
                            </td>
                            <td className="table-cell">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isExpanded && !hasLinks && (
                  <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                    Cette page ne contient aucun lien interne
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default PageLinksTable;
