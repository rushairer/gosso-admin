import React from 'react';
import { cn } from '../../lib/utils';

export function ButtonGroup({
  children,
  align = 'left',
  compact = false,
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'between';
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        align === 'right' && 'justify-end',
        align === 'between' && 'justify-between',
        compact && 'gap-1.5',
        className
      )}
    >
      {children}
    </div>
  );
}
