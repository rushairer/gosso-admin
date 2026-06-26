import React from 'react';

export function Tag({
  children,
  tone = 'primary',
  title,
}: {
  children: React.ReactNode;
  tone?: 'primary' | 'secondary';
  title?: string;
}) {
  return (
    <span className={`badge ${tone === 'secondary' ? 'badge-secondary' : ''}`} title={title} style={{ margin: 0 }}>
      {children}
    </span>
  );
}

export function StatusBadge({
  children,
  tone,
  compact = false,
}: {
  children: React.ReactNode;
  tone: 'success' | 'danger' | 'warning' | 'neutral';
  compact?: boolean;
}) {
  return <span className={`status-pill ${tone} ${compact ? 'compact' : ''}`}>{children}</span>;
}
