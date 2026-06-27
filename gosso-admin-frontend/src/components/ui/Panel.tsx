import React from 'react';

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card admin-panel ${className}`} style={{ padding: 0, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PanelBody({
  children,
  stack = false,
  flush = false,
  className = '',
}: {
  children: React.ReactNode;
  stack?: boolean;
  flush?: boolean;
  className?: string;
}) {
  const classes = ['panel-body', stack ? 'panel-stack' : '', flush ? 'flush' : '', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}

export function PlainSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="plain-section">
      {title && <div className="plain-section-title">{title}</div>}
      {children}
    </div>
  );
}
