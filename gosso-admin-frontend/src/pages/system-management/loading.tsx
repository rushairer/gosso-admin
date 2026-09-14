import type { ReactNode } from 'react';
import { Card, Skeleton } from '@gouno/ui/core';
import { PageSkeleton } from '@gouno/ui/gouno';

type LoadingColumn = {
  header: ReactNode;
  skeletonClassName?: string;
  align?: 'left' | 'right';
};

export function SystemCollectionLoading({
  label,
  columns,
  rows = 4,
  showPagination = false,
}: {
  label: string;
  columns: readonly LoadingColumn[];
  rows?: number;
  density?: 'default' | 'compact';
  showPagination?: boolean;
}) {
  return (
    <PageSkeleton
      layout="collection"
      aria-label={label}
      rows={rows}
      columns={columns.length}
      pagination={showPagination}
    />
  );
}

function FieldSkeleton({ width = 'w-28' }: { width?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={`h-4 ${width}`} />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SiteSettingsLoading({ label }: { label: string }) {
  return (
    <div
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Card padding="none" className="gap-0 overflow-clip">
        <div className="flex flex-col gap-5 p-6">
          <FieldSkeleton width="w-24" />
          <FieldSkeleton width="w-20" />
          <FieldSkeleton width="w-24" />
          <FieldSkeleton width="w-28" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t px-6 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </Card>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <Card padding="base" className="overflow-hidden">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="aspect-[16/10] w-full rounded-lg" />
        </Card>
      </div>
    </div>
  );
}

export function SystemStatusLoading({ label }: { label: string }) {
  return (
    <PageSkeleton
      layout="dashboard"
      aria-label={label}
      statistics={3}
      sections={3}
    />
  );
}
