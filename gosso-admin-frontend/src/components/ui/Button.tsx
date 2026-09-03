import React, { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../lib/utils';

export type ButtonVariant =
  'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'default' | 'destructive' | 'outline';
export type ButtonSize = 'sm' | 'base' | 'lg' | 'regular' | 'compact' | 'default' | 'icon';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'btn btn-primary',
        default: 'btn btn-primary',
        secondary: 'btn btn-secondary',
        danger: 'btn btn-danger',
        destructive: 'btn btn-danger',
        ghost: 'btn btn-ghost',
        outline: 'btn btn-secondary',
        link: 'btn btn-link',
      },
      size: {
        base: 'btn-base',
        default: 'btn-base',
        regular: 'btn-base',
        sm: 'btn-sm',
        compact: 'btn-sm',
        lg: 'btn-lg',
        icon: 'btn-icon',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'base',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export interface ButtonLinkProps extends Omit<LinkProps, 'to'>, VariantProps<typeof buttonVariants> {
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
  return cn(buttonVariants({ variant: variant as any, size: size as any }), loading && 'is-loading', className);
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
