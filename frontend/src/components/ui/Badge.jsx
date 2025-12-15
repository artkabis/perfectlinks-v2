import clsx from 'clsx';

const Badge = ({ children, variant = 'info', className, ...props }) => {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };

  return (
    <span
      className={clsx('badge', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
