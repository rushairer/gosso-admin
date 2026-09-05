import React, { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../lib/utils';

export type ButtonVariant =
  'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'default' | 'destructive' | 'outline';

export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon' | 'base' | 'regular' | 'compact';
export type ButtonIconPosition = 'left' | 'right';

export const buttonVariants = cva(
  'btn inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control,6px)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.985]',
  {
    variants: {
      variant: {
        default: 'btn-primary bg-primary text-primary-foreground shadow-sm hover:bg-blue-600 active:bg-blue-700',
        primary: 'btn-primary bg-primary text-primary-foreground shadow-sm hover:bg-blue-600 active:bg-blue-700',
        destructive:
          'btn-danger border border-destructive/30 bg-destructive/15 text-red-200 hover:bg-destructive/25 active:bg-destructive/35',
        danger:
          'btn-danger border border-destructive/30 bg-destructive/15 text-red-200 hover:bg-destructive/25 active:bg-destructive/35',
        outline:
          'btn-secondary border border-border bg-secondary text-foreground hover:bg-zinc-800 hover:border-zinc-600 active:bg-zinc-900',
        secondary:
          'btn-secondary border border-border bg-secondary text-foreground hover:bg-zinc-800 hover:border-zinc-600 active:bg-zinc-900',
        ghost: 'btn-ghost text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-zinc-800',
        link: 'btn-link text-primary underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'btn-base h-9 px-4 py-2',
        base: 'btn-base h-9 px-4 py-2',
        regular: 'btn-base h-9 px-4 py-2',
        sm: 'btn-sm h-8 rounded-[4px] px-3 text-xs',
        compact: 'btn-sm h-8 rounded-[4px] px-3 text-xs',
        lg: 'btn-lg h-11 rounded-lg px-8 text-base',
        icon: 'btn-icon h-9 w-9 p-0',
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
  iconPosition?: ButtonIconPosition;
}

export interface ButtonLinkProps extends Omit<LinkProps, 'to'>, VariantProps<typeof buttonVariants> {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: ButtonIconPosition;
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
  return cn(buttonVariants({ variant, size }), loading && 'is-loading cursor-wait opacity-80', className);
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
        <span className="btn-icon inline-flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children && <span className="btn-label min-w-0">{children}</span>}
      {!loading && icon && iconPosition === 'right' ? (
        <span className="btn-icon inline-flex shrink-0 items-center" aria-hidden="true">
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
        className: cn(disabled && 'is-disabled pointer-events-none opacity-50', className),
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
        <span className="btn-icon inline-flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children && <span className="btn-label min-w-0">{children}</span>}
      {icon && iconPosition === 'right' ? (
        <span className="btn-icon inline-flex shrink-0 items-center" aria-hidden="true">
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
    size = 'icon',
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
        size: size === 'sm' || size === 'compact' ? 'sm' : 'icon',
        loading,
        className: cn('icon-btn', className),
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
        <span className="icon-btn__icon inline-flex shrink-0 items-center justify-center" aria-hidden="true">
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
  { to, label, icon, variant = 'ghost', size = 'icon', className = '', disabled = false, children, onClick, ...props },
  ref
) {
  return (
    <Link
      ref={ref}
      to={to}
      className={buttonClassNames({
        variant,
        size: size === 'sm' || size === 'compact' ? 'sm' : 'icon',
        className: cn('icon-btn', disabled && 'is-disabled pointer-events-none opacity-50', className),
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
        <span className="icon-btn__icon inline-flex shrink-0 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : (
        children
      )}
    </Link>
  );
});

export function ChoiceButton({
  selected = false,
  children,
  className = '',
  ...props
}: Omit<ButtonProps, 'variant'> & { selected?: boolean }) {
  return (
    <Button
      {...props}
      variant={selected ? 'primary' : 'ghost'}
      className={cn(
        'choice-button justify-start font-normal',
        selected && 'is-selected font-medium shadow-sm',
        className
      )}
      aria-pressed={selected}
    >
      {children}
    </Button>
  );
}
