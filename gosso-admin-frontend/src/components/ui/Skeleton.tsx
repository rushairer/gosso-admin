import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ variant = 'text', width, height, className = '', style, ...props }: SkeletonProps) {
  const dynamicStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      className={cn(
        'skeleton',
        `skeleton-${variant}`,
        'animate-pulse bg-muted',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        variant === 'text' && 'h-4 rounded-[4px]',
        variant === 'card' && 'h-32 rounded-xl',
        className
      )}
      style={dynamicStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('table-skeleton-wrap w-full space-y-3 p-4', className)}
      aria-label="Loading table data"
      role="status"
    >
      <div className="table-skeleton-header flex gap-4 border-b border-border pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} variant="text" height={16} className="table-skeleton-th flex-1" />
        ))}
      </div>
      <div className="table-skeleton-body space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`tr-${rowIndex}`}
            className="table-skeleton-row flex gap-4 py-2 border-b border-border/50 last:border-0"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`td-${rowIndex}-${colIndex}`}
                variant="text"
                height={16}
                width={colIndex === 0 ? '70%' : colIndex === columns - 1 ? '40%' : '85%'}
                className="table-skeleton-td flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
