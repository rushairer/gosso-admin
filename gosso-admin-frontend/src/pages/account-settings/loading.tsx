import type { ReactNode } from 'react';
import { Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@gouno/ui/core';

export function MfaLoadingContent({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite" aria-label={label}>
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-9 w-48" />
    </div>
  );
}

export function PasskeysLoading({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <ul className="divide-y overflow-hidden rounded-lg border border-border/80 bg-card">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type SessionLoadingHeader = {
  label: ReactNode;
  align?: 'left' | 'right';
  skeletonClassName?: string;
};

export function SessionsLoading({
  label,
  headers,
  rows = 4,
}: {
  label: string;
  headers: readonly SessionLoadingHeader[];
  rows?: number;
}) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <Table bordered>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index} className={header.align === 'right' ? 'text-right' : undefined}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map((header, columnIndex) => (
                <TableCell key={columnIndex}>
                  <Skeleton
                    className={`${header.skeletonClassName ?? 'h-4 w-28'} ${header.align === 'right' ? 'ml-auto' : ''}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
