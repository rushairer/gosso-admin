import React from 'react';

export type BadgeTone = 'primary' | 'secondary' | 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export function Tag({
  children,
  tone = 'primary',
  title,
  className = '',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  title?: string;
  className?: string;
}) {
  return (
    <span className={`badge badge-${tone} ${className}`} title={title}>
      {children}
    </span>
  );
}

export function Badge({
  children,
  tone = 'primary',
  title,
  className = '',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  title?: string;
  className?: string;
}) {
  return (
    <span className={`badge badge-${tone} ${className}`} title={title}>
      {children}
    </span>
  );
}

export function StatusBadge({
  children,
  tone,
  compact = false,
  className = '',
}: {
  children: React.ReactNode;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  compact?: boolean;
  className?: string;
}) {
  return <span className={`status-pill ${tone} ${compact ? 'compact' : ''} ${className}`}>{children}</span>;
}
