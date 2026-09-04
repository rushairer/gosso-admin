import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'badge inline-flex items-center whitespace-nowrap border text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      tone: {
        primary: 'badge-primary badge-brand badge--brand',
        brand: 'badge-primary badge-brand badge--brand',
        secondary: 'badge-secondary badge-neutral badge--neutral',
        neutral: 'badge-secondary badge-neutral badge--neutral',
        success: 'badge-success badge--success',
        warning: 'badge-warning badge--warning',
        danger: 'badge-danger badge--danger',
        destructive: 'badge-danger badge--danger',
      },
      pill: {
        true: 'badge--pill',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      pill: false,
    },
  }
);

export type BadgeTone =
  'primary' | 'secondary' | 'brand' | 'success' | 'warning' | 'danger' | 'destructive' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  tone?: BadgeTone;
  pill?: boolean;
}

export function Badge({ children, tone = 'neutral', pill = false, title, className, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, pill }), className)} title={title} {...props}>
      {children}
    </span>
  );
}

/** @deprecated Use `Badge` instead. */
export const Tag = Badge;

export function StatusBadge({
  children,
  tone,
  compact = false,
  className = '',
}: {
  children: React.ReactNode;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  compact?: boolean;
  className?: string;
}) {
  return (
    <Badge tone={tone} className={cn('status-pill', tone, compact && 'compact', className)}>
      {children}
    </Badge>
  );
}
