import type { ReactNode } from 'react';
import { Alert } from '@gouno/ui/core';

export function ManagementPanelLead({ description, actions }: { description?: ReactNode; actions?: ReactNode }) {
  if (!description && !actions) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {description ? <p className="m-0 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p> : <span />}
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function StatusNotice({
  children,
  type = 'success',
}: {
  children: ReactNode;
  type?: 'success' | 'error' | 'info' | 'warning';
}) {
  return <Alert type={type} showIcon title={children} />;
}
