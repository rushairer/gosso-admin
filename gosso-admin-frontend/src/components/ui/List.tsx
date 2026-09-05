import React from 'react';
import { cn } from '../../lib/utils';

export function ListStack({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-border/60 rounded-lg border border-border bg-card', className)}>{children}</div>
  );
}

export function ListRow({
  icon,
  title,
  meta,
  action,
  children,
  className = '',
}: {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between p-4 gap-4 transition-colors hover:bg-muted/30', className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && <span className="flex shrink-0 items-center justify-center text-muted-foreground">{icon}</span>}
        {children || (
          <div className="min-w-0 flex-1">
            {title && <div className="text-sm font-medium text-foreground truncate">{title}</div>}
            {meta && <div className="text-xs text-muted-foreground mt-0.5 truncate">{meta}</div>}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
