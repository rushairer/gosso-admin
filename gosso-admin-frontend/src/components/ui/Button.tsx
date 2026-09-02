import React, { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'base' | 'lg' | 'regular' | 'compact';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export interface ButtonLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
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
  if (size === 'sm' || size === 'compact') parts.push('btn-sm');
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

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {
    variant = 'secondary',
    size = 'base',
    icon,
    iconPosition = 'left',
    children,
    className = '',
    to,
    disabled = false,
    onClick,
    ...props
  },
  ref
) {
  return (
    <Link
      ref={ref}
      to={to}
      className={buttonClassNames({
        variant,
        size,
        className: `${disabled ? 'is-disabled' : ''} ${className}`,
      })}
      aria-disabled={disabled ? 'true' : undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      {...props}
    >
      {icon && iconPosition === 'left' ? (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children && <span className="btn-label">{children}</span>}
      {icon && iconPosition === 'right' ? (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </Link>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    variant = 'ghost',
    size = 'base',
    loading = false,
    className = '',
    children,
    disabled,
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
      className={buttonClassNames({
        variant,
        size,
        loading,
        className: `icon-btn ${className}`,
      })}
      aria-label={label}
      title={label}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" className="btn-spinner" />
      ) : icon ? (
        <span className="icon-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : (
        children
      )}
    </button>
  );
});
