import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      tone: {
        primary: 'badge badge-primary border-blue-500/30 bg-blue-500/10 text-blue-300',
        brand: 'badge badge-brand border-blue-500/30 bg-blue-500/10 text-blue-300',
        secondary: 'badge badge-secondary border-slate-700 bg-slate-800 text-slate-300',
        neutral: 'badge badge-neutral border-slate-700 bg-slate-800 text-slate-300',
        success: 'badge badge-success border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        warning: 'badge badge-warning border-amber-500/30 bg-amber-500/10 text-amber-300',
        danger: 'badge badge-danger border-rose-500/30 bg-rose-500/10 text-rose-300',
      },
    },
    defaultVariants: {
      tone: 'primary',
    },
  }
);

export type BadgeTone = 'primary' | 'secondary' | 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  tone?: BadgeTone;
}

export function Badge({ children, tone = 'primary', title, className, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} title={title} {...props}>
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
    <span className={cn('status-pill', tone, compact && 'compact text-[11px] px-2 py-0.5', className)}>{children}</span>
  );
}
