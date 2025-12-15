import { Phone, Mail, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui';

const ConversionLinks = ({ internalLinks }) => {
  // Extract all conversion links (tel:, mailto:, sms:, etc.)
  const conversionLinks = [];

  internalLinks.forEach((page) => {
    page.internalLinks.forEach((link) => {
      const url = link.url.toLowerCase();

      if (
        url.startsWith('tel:') ||
        url.startsWith('mailto:') ||
        url.startsWith('sms:') ||
        url.startsWith('whatsapp:') ||
        url.startsWith('skype:')
      ) {
        let type = 'other';
        if (url.startsWith('tel:')) type = 'phone';
        else if (url.startsWith('mailto:')) type = 'email';
        else if (url.startsWith('sms:') || url.startsWith('whatsapp:')) type = 'message';

        conversionLinks.push({
          sourceUrl: page.link,
          targetUrl: link.url,
          anchor: link.anchor,
          type,
        });
      }
    });
  });

  // Group by type
  const linksByType = conversionLinks.reduce((acc, link) => {
    if (!acc[link.type]) {
      acc[link.type] = [];
    }
    acc[link.type].push(link);
    return acc;
  }, {});

  const getTypeInfo = (type) => {
    switch (type) {
      case 'phone':
        return { icon: Phone, label: 'Téléphone', color: 'text-success-600', bg: 'bg-success-50' };
      case 'email':
        return { icon: Mail, label: 'Email', color: 'text-primary-600', bg: 'bg-primary-50' };
      case 'message':
        return { icon: MessageSquare, label: 'Messages', color: 'text-warning-600', bg: 'bg-warning-50' };
      default:
        return { icon: Phone, label: 'Autre', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  if (conversionLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-success-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Liens de conversion
            </h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Phone className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">
              Aucun lien de conversion détecté
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Les liens de type tel:, mailto:, sms: apparaîtront ici.
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
            <Phone className="h-5 w-5 text-success-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Liens de conversion ({conversionLinks.length})
            </h3>
          </div>
          <span className="text-sm text-gray-600">
            Contact et interaction
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {Object.keys(linksByType).map((type) => {
            const links = linksByType[type];
            const typeInfo = getTypeInfo(type);
            const Icon = typeInfo.icon;

            return (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                    <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                  </div>
                  <h4 className="font-semibold text-gray-900">{typeInfo.label}</h4>
                  <span className="text-sm text-gray-500 ml-auto">
                    {links.length} lien(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <a
                            href={link.targetUrl}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 break-all"
                          >
                            {link.targetUrl}
                          </a>
                          {link.anchor && (
                            <p className="text-xs text-gray-600 mt-1">
                              Ancre: "{link.anchor}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Depuis: {link.sourceUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 À propos des liens de conversion :</strong><br />
            Ces liens permettent aux visiteurs de vous contacter directement (appel, email, SMS).
            Ils sont essentiels pour la conversion et l'engagement des utilisateurs.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default ConversionLinks;
