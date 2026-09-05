import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'badge inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      tone: {
        primary: 'border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80',
        brand: 'border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80',
        secondary: 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        neutral: 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        warning: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
        danger: 'border-red-500/30 bg-red-500/15 text-red-300',
        destructive: 'border-red-500/30 bg-red-500/15 text-red-300',
        info: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
      },
      pill: {
        true: 'rounded-full',
        false: 'rounded-[var(--radius-control,4px)]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      pill: false,
    },
  }
);

export type BadgeTone =
  'primary' | 'secondary' | 'brand' | 'success' | 'warning' | 'danger' | 'destructive' | 'neutral' | 'info';

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
    <Badge
      tone={tone}
      pill
      className={cn('status-pill', compact && 'compact', compact && 'px-2 py-0 text-[11px]', className)}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          tone === 'success' && 'bg-emerald-400',
          tone === 'danger' && 'bg-red-400',
          tone === 'warning' && 'bg-amber-400',
          tone === 'neutral' && 'bg-zinc-400'
        )}
        aria-hidden="true"
      />
      {children}
    </Badge>
  );
}
