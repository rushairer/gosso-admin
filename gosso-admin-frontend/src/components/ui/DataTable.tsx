import React from 'react';
import { TableSkeleton } from './Skeleton';

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
    return <div className="data-table-empty-wrap">{emptyState}</div>;
  }

  return (
    <div className={`data-table-wrap ${className}`}>
      <table className="admin-table">{children}</table>
    </div>
  );
}
