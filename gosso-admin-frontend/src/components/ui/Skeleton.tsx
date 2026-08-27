import React from 'react';

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
    <div className={`skeleton skeleton-${variant} ${className}`} style={dynamicStyle} aria-hidden="true" {...props} />
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
    <div className={`table-skeleton-wrap ${className}`} aria-label="Loading table data" role="status">
      <div className="table-skeleton-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} variant="text" height={16} className="table-skeleton-th" />
        ))}
      </div>
      <div className="table-skeleton-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`tr-${rowIndex}`} className="table-skeleton-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`td-${rowIndex}-${colIndex}`}
                variant="text"
                height={16}
                width={colIndex === 0 ? '70%' : colIndex === columns - 1 ? '40%' : '85%'}
                className="table-skeleton-td"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
