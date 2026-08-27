import React, { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'base' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function buttonClassNames({
  variant = 'secondary',
  size = 'base',
  loading = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
} = {}): string {
  const parts = ['btn', `btn-${variant}`];
  if (size === 'sm') parts.push('btn-sm');
  if (size === 'lg') parts.push('btn-lg');
  if (loading) parts.push('is-loading');
  if (className) parts.push(className);
  return parts.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'base',
    loading = false,
    disabled,
    icon,
    iconPosition = 'left',
    children,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClassNames({ variant, size, loading, className })}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" className="btn-spinner" />
      ) : icon && iconPosition === 'left' ? (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children && <span className="btn-label">{children}</span>}
      {!loading && icon && iconPosition === 'right' ? (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(function IconButton({ label, variant = 'ghost', size = 'base', className = '', children, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={buttonClassNames({ variant, size, className: `icon-btn ${className}` })}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
});
