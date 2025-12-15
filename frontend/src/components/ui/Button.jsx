import { forwardRef } from 'react';
import clsx from 'clsx';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';

    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-danger',
      success: 'btn-success',
      outline: 'btn-outline',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="spinner h-4 w-4 mr-2" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
