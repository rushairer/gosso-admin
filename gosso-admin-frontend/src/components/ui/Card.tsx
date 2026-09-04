import React from 'react';
import { cn } from '../../lib/utils';

export type CardVariant = 'default' | 'subtle' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'base' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  as?: React.ElementType;
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'base',
  interactive = false,
  as: Component = 'div',
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'glass-card',
        variant !== 'default' && `glass-card--${variant}`,
        `glass-card--padding-${padding}`,
        interactive && 'glass-card--interactive',
        className
      )}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  if (children) {
    return <div className={cn('card-header', className)}>{children}</div>;
  }

  return (
    <div className={cn('card-header', className)}>
      <div className="card-title-group">
        {title && <h3 className="card-title">{title}</h3>}
        {description && <p className="card-description">{description}</p>}
      </div>
      {action && <div className="card-action">{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return <div className={cn('card-content', flush && 'flush', className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('card-footer', className)}>{children}</div>;
}
