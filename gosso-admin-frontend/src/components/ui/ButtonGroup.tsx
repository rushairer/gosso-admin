import React from 'react';

export function ButtonGroup({
  children,
  align = 'left',
  compact = false,
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'between';
  compact?: boolean;
  className?: string;
}) {
  const classes = ['button-group', `button-group-${align}`, compact ? 'compact' : '', className]
    .filter(Boolean)
    .join(' ');
  return <div className={classes}>{children}</div>;
}
