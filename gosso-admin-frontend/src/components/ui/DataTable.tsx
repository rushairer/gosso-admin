import React from 'react';
import { TableSkeleton } from './Skeleton';
import { cn } from '../../lib/utils';

export interface DataTableProps {
  children?: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
  loadingCols?: number;
  empty?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable({
  children,
  loading = false,
  loadingRows = 5,
  loadingCols = 4,
  empty = false,
  emptyState,
  className = '',
}: DataTableProps) {
  if (loading) {
    return <TableSkeleton rows={loadingRows} columns={loadingCols} className={className} />;
  }

  if (empty && emptyState) {
    return <div className="p-8 text-center text-muted-foreground">{emptyState}</div>;
  }

  return (
    <div className={cn('relative w-full overflow-auto rounded-lg border border-border bg-card', className)}>
      <table className="w-full caption-bottom text-sm">{children}</table>
    </div>
  );
}
