import React from 'react';
import { cn } from '../../lib/utils';

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm', className)}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/60 mb-6',
        className
      )}
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0 mt-3 sm:mt-0">{action}</div>}
    </div>
  );
}

export function PanelBody({
  children,
  stack = false,
  flush = false,
  className = '',
}: {
  children: React.ReactNode;
  stack?: boolean;
  flush?: boolean;
  className?: string;
}) {
  return <div className={cn(stack && 'space-y-6', flush && '-mx-6 -mb-6', className)}>{children}</div>;
}

export function PlainSection({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-4 first:pt-0 last:pb-0', className)}>
      {title && <div className="text-sm font-semibold text-foreground mb-3">{title}</div>}
      {children}
    </div>
  );
}
