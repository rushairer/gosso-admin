import type { ReactNode } from 'react';
import { Alert, Text } from '@gouno/ui/core';

export function ManagementPanelLead({ description, actions }: { description?: ReactNode; actions?: ReactNode }) {
  if (!description && !actions) return null;

  return (
    <div
      data-slot="gosso-management-panel-lead"
      data-pattern="tab-panel-lead"
      className="flex min-h-9 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0">
        {description ? (
          <Text tone="muted" size="sm" leading="relaxed" className="max-w-3xl">
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
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
