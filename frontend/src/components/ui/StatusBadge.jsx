import { LINK_STATUS_CONFIG } from '@/utils/constants';
import clsx from 'clsx';

const StatusBadge = ({ status, className }) => {
  const config = LINK_STATUS_CONFIG[status] || LINK_STATUS_CONFIG[0];

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {status} - {config.label}
    </span>
  );
};

export default StatusBadge;
