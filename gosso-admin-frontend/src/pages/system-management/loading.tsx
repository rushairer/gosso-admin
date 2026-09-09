import type { ReactNode } from 'react';
import {
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@gouno/ui/core';

type LoadingColumn = {
  header: ReactNode;
  skeletonClassName?: string;
  align?: 'left' | 'right';
};

export function SystemCollectionLoading({
  label,
  columns,
  rows = 4,
  density = 'default',
  showPagination = false,
}: {
  label: string;
  columns: readonly LoadingColumn[];
  rows?: number;
  density?: 'default' | 'compact';
  showPagination?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite" aria-label={label}>
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Table bordered density={density}>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.align === 'right' ? 'text-right' : undefined}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <TableCell key={columnIndex}>
                  <Skeleton
                    className={`${column.skeletonClassName ?? 'h-4 w-24'} ${
                      column.align === 'right' ? 'ml-auto' : ''
                    }`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {showPagination ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ) : null}
    </div>
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

function DefinitionLoadingCard() {
  return (
    <Card padding="base">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="divide-y">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-5"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SystemStatusLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-5" role="status" aria-live="polite" aria-label={label}>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} padding="base">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-6 w-32" />
          </Card>
        ))}
      </div>

      <Card padding="base">
        <Skeleton className="mb-4 h-5 w-44" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg border p-4">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-36 flex-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </Card>

      <DefinitionLoadingCard />
      <DefinitionLoadingCard />
    </div>
  );
}
