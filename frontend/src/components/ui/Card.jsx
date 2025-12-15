import clsx from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => {
  return (
    <div className={clsx('card-header', className)} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ children, className, ...props }) => {
  return (
    <div className={clsx('card-body', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div className={clsx('card-footer', className)} {...props}>
      {children}
    </div>
  );
};

export default Card;
