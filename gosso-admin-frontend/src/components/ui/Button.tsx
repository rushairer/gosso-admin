import React, { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../lib/utils';

export type ButtonVariant =
  'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'default' | 'destructive' | 'outline';

/**
 * Canonical sizes are sm/default/lg/icon. The legacy base/regular/compact
 * aliases remain supported while feature code migrates to the shared contract.
 */
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon' | 'base' | 'regular' | 'compact';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
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
      size: 'default',
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
  size = 'default',
  loading = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
} = {}): string {
  return cn(buttonVariants({ variant, size }), loading && 'is-loading', className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'default',
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
        <LoadingSpinner size="sm" className="btn-spinner shrink-0" />
      ) : icon && iconPosition === 'left' ? (
        <span className="btn-icon shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children && <span className="btn-label min-w-0">{children}</span>}
      {!loading && icon && iconPosition === 'right' ? (
        <span className="btn-icon shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </button>
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {
    variant = 'secondary',
    size = 'default',
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
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    >
      {icon && iconPosition === 'left' ? (
        <span className="btn-icon shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children && <span className="btn-label min-w-0">{children}</span>}
      {icon && iconPosition === 'right' ? (
        <span className="btn-icon shrink-0" aria-hidden="true">
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
    size = 'default',
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
        <LoadingSpinner size="sm" className="btn-spinner shrink-0" />
      ) : icon ? (
        <span className="icon-btn__icon shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

export interface IconButtonLinkProps extends Omit<LinkProps, 'to'>, VariantProps<typeof buttonVariants> {
  to: string;
  label: string;
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

export const IconButtonLink = forwardRef<HTMLAnchorElement, IconButtonLinkProps>(function IconButtonLink(
  {
    to,
    label,
    icon,
    variant = 'ghost',
    size = 'default',
    className = '',
    disabled = false,
    children,
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
        className: `icon-btn ${disabled ? 'is-disabled' : ''} ${className}`,
      })}
      aria-label={label}
      title={label}
      aria-disabled={disabled ? 'true' : undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    >
      {icon ? (
        <span className="icon-btn__icon shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : (
        children
      )}
    </Link>
  );
});
