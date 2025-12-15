import { FileText, Link as LinkIcon, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardBody } from '@/components/ui';

const StatCard = ({ icon: Icon, label, value, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const AnalysisOverview = ({ data }) => {
  const { meta } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={FileText}
        label="Pages du sitemap"
        value={meta.totalUrls}
        color="primary"
      />
      <StatCard
        icon={LinkIcon}
        label="Liens internes uniques"
        value={meta.totalInternalLinks}
        color="success"
      />
      <StatCard
        icon={AlertTriangle}
        label="Pages orphelines"
        value={meta.orphanLinks}
        color={meta.orphanLinks > 0 ? 'warning' : 'success'}
      />
      <StatCard
        icon={Clock}
        label="Durée d'analyse"
        value={meta.duration}
        color="primary"
      />
    </div>
  );
};

export default AnalysisOverview;
