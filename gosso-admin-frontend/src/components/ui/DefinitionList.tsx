import React from 'react';
import { cn } from '../../lib/utils';

export function DefinitionList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-border/60 rounded-lg border border-border bg-card/40', className)}>
      {children}
    </div>
  );
}

export function DefinitionRow({
  label,
  children,
  mono = false,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2', className)}>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-sm text-foreground break-all', mono && 'font-mono text-xs text-sky-300')}>
        {children}
      </div>
    </div>
  );
}
